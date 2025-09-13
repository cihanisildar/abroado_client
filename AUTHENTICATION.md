# Authentication System Documentation

## Overview

The Gurbetlik Server implements a robust JWT-based authentication system with comprehensive security measures. This document provides detailed information about the authentication system and how to implement it on the frontend.

## 🔐 Authentication Architecture

### Authentication Flow
1. **Registration/Login** → Server validates credentials and sets secure HTTP-only cookies
2. **Token Refresh** → Automatic token refresh using refresh tokens
3. **Protected Routes** → Middleware validates tokens from cookies or Authorization header
4. **Logout** → Server clears cookies and updates user status

### Security Features
- **JWT Tokens**: Short-lived access tokens (15 minutes) with separate refresh tokens (30 days)
- **HTTP-Only Cookies**: Secure cookie storage prevents XSS attacks
- **Rate Limiting**: Comprehensive rate limiting on all authentication endpoints
- **Password Security**: Strong password requirements with bcrypt hashing (12 rounds)
- **Input Validation**: Zod schemas with sanitization
- **CORS Protection**: Strict cross-origin request policies
- **Security Headers**: Helmet middleware with CSP, HSTS, and other security headers

## 🚀 API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/register` | POST | Register new user | 5 requests / 15 min |
| `/api/auth/login` | POST | User login | 5 requests / 15 min |
| `/api/auth/logout` | POST | User logout | None |
| `/api/auth/refresh` | POST | Refresh access token | None |
| `/api/auth/profile` | GET | Get user profile | None |
| `/api/auth/profile` | PUT | Update user profile | None |

### Request/Response Examples

#### Registration
```typescript
// POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123!",
  "role": "EXPLORER" // or "ABROADER"
}

// Response (201)
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "EXPLORER",
      "currentCity": null,
      "currentCountry": null,
      "targetCountry": null,
      "techStack": null,
      "bio": null,
      "avatar": null,
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Login
```typescript
// POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response (200) - Same structure as registration
// Cookies are automatically set: gb_accessToken, gb_refreshToken
```

#### Token Refresh
```typescript
// POST /api/auth/refresh
// No body required - uses refresh token from cookie

// Response (200)
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": null
}
```

## 🖥️ Frontend Implementation

### React/Next.js Implementation

#### 1. Authentication Context
```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'EXPLORER' | 'ABROADER';
  currentCity?: string;
  currentCountry?: string;
  targetCountry?: string;
  techStack?: string;
  bio?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData, avatar?: File) => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'EXPLORER' | 'ABROADER';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      } else if (response.status === 401) {
        // Try to refresh token
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    setUser(result.data.user);
  };

  const register = async (userData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    setUser(result.data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Token refreshed successfully
        await checkAuthStatus();
      } else {
        // Refresh failed, user needs to login again
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const updateProfile = async (data: UpdateProfileData, avatar?: File) => {
    const formData = new FormData();
    
    // Add text fields
    Object.keys(data).forEach(key => {
      const value = data[key as keyof UpdateProfileData];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Add avatar if provided
    if (avatar) {
      formData.append('avatar', avatar);
    }

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    const result = await response.json();
    setUser(result.data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      refreshToken,
      updateProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. HTTP Client with Automatic Token Refresh
```typescript
// utils/api.ts
class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Always include cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - try token refresh
      if (response.status === 401 && endpoint !== '/api/auth/refresh') {
        const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Retry original request
          return fetch(url, config);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

#### 3. Protected Route Component
```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'EXPLORER' | 'ABROADER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole && user.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

#### 4. Login Form Component
```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;
```

### Vue.js Implementation

#### Authentication Composable
```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'EXPLORER' | 'ABROADER';
  // ... other user properties
}

const user = ref<User | null>(null);
const loading = ref(false);

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    loading.value = true;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      user.value = result.data.user;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      user.value = null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        user.value = result.data;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
  };
};
```

### Angular Implementation

#### Authentication Service
```typescript
// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpInterceptor } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'EXPLORER' | 'ABROADER';
  // ... other properties
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/auth/login', { email, password }, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        this.userSubject.next(response.data.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post('/api/auth/logout', {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.userSubject.next(null);
      })
    );
  }

  checkAuthStatus(): void {
    this.http.get('/api/auth/profile', {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.userSubject.next(response.data);
      },
      error: () => {
        this.userSubject.next(null);
      }
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}
```

## 🔒 Password Requirements

The system enforces strong password requirements:
- Minimum 8 characters, maximum 128 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter  
- Must contain at least one number
- Must contain at least one special character (@$!%*?&)

## 🚫 Rate Limiting

### Authentication Endpoints
- **Login/Register**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **Email Verification**: 5 attempts per hour per IP

### Other Endpoints
- **File Upload**: 5 uploads per 15 minutes
- **Post Creation**: 10 posts per hour
- **Comments**: 20 comments per 10 minutes
- **Reviews**: 5 reviews per 24 hours

## 🍪 Cookie Configuration

The system uses secure HTTP-only cookies with the following settings:

```typescript
const cookieOptions = {
  httpOnly: true,           // Prevent XSS attacks
  secure: true,             // HTTPS only in production
  sameSite: 'none',         // Cross-origin requests in production
  domain: 'yourdomain.com', // Set for production
  maxAge: 15 * 60 * 1000    // 15 minutes for access token
};
```

### Environment Variables
```env
# Required for production
COOKIE_DOMAIN=yourdomain.com
NODE_ENV=production

# JWT Configuration  
JWT_SECRET=your-super-secure-secret-key
JWT_REFRESH_SECRET=your-different-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
```

## 🛡️ Security Best Practices

### For Frontend Developers

1. **Never store tokens in localStorage or sessionStorage**
   - Use HTTP-only cookies (automatically handled by the server)
   - Include `credentials: 'include'` in all fetch requests

2. **Handle authentication errors properly**
   - Implement automatic token refresh
   - Redirect to login on 401 errors
   - Show user-friendly error messages

3. **Implement proper logout**
   - Clear all user state
   - Call the logout endpoint to clear server-side session

4. **Validate user permissions on frontend**
   - Check user roles before showing UI elements
   - Remember: Always validate on backend too

5. **Use HTTPS in production**
   - Required for secure cookies
   - Prevents token interception

### Common Pitfalls to Avoid

❌ **Don't do this:**
```javascript
// Storing tokens in localStorage (vulnerable to XSS)
localStorage.setItem('token', token);

// Not including credentials
fetch('/api/auth/profile'); // Missing credentials: 'include'

// Exposing tokens in client-side code
const token = response.data.accessToken; // Tokens shouldn't be accessible
```

✅ **Do this instead:**
```javascript
// Let the server handle cookies automatically
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include', // Always include credentials
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
```

## 🔄 Token Refresh Flow

The authentication system automatically handles token refresh:

1. **Access tokens expire after 15 minutes**
2. **When a 401 error occurs**, the client should call `/api/auth/refresh`
3. **If refresh succeeds**, retry the original request
4. **If refresh fails**, redirect user to login

## 🧪 Testing Authentication

### Testing Endpoints with curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "SecurePass123!",
    "role": "EXPLORER"
  }' \
  -c cookies.txt

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt

# Access protected endpoint
curl -X GET http://localhost:3001/api/auth/profile \
  -b cookies.txt

# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

## 🚨 Error Handling

### Common Error Responses

```typescript
// 400 - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "username": ["Username must be at least 2 characters"]
  }
}

// 401 - Authentication Required
{
  "success": false,
  "message": "Access token required"
}

// 403 - Insufficient Permissions
{
  "success": false,
  "message": "Insufficient permissions"
}

// 429 - Rate Limited
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

## 📚 Additional Resources

- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HTTP-only Cookies vs localStorage](https://academind.com/tutorials/localstorage-vs-cookies-xss)

## 🤝 Support

For authentication-related issues:
1. Check the server logs for detailed error messages
2. Verify environment variables are properly set
3. Ensure HTTPS is configured in production
4. Review the SECURITY.md file for additional security considerations

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Compatibility**: Node.js 18+, TypeScript 4.5+