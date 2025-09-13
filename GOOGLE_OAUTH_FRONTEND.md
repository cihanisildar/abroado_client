# Google OAuth Frontend Integration Guide

## 📋 Overview

This guide provides complete frontend implementation examples for integrating Google OAuth with the Gurbetlik Server authentication system. The backend supports both traditional email/password authentication and Google OAuth, maintaining the same JWT token-based security model.

## 🚀 Quick Start

### 1. Check OAuth Status
First, verify that Google OAuth is configured on the server:

```typescript
// Check if Google OAuth is available
const response = await fetch('/api/auth/google/status', {
  credentials: 'include'
});
const { data } = await response.json();

if (data.configured) {
  // Google OAuth is available
  console.log('Google OAuth available at:', data.authUrl);
} else {
  // Google OAuth is not configured - hide Google login button
  console.log('Google OAuth not configured');
}
```

### 2. Initiate Google OAuth
When user clicks "Sign in with Google":

```typescript
// Redirect to Google OAuth
window.location.href = '/api/auth/google';
```

### 3. Handle OAuth Callback
The server automatically handles the OAuth callback and redirects back to your frontend with authentication cookies set. No additional frontend handling required for the callback itself.

## 🔧 Implementation Examples

### React/Next.js Complete Implementation

#### 1. OAuth Service Layer

```typescript
// lib/auth/googleOAuth.ts
export interface GoogleOAuthStatus {
  configured: boolean;
  authUrl: string | null;
  callbackUrl: string | null;
}

export const checkGoogleOAuthStatus = async (): Promise<GoogleOAuthStatus> => {
  try {
    const response = await fetch('/api/auth/google/status', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check OAuth status');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error checking Google OAuth status:', error);
    return { configured: false, authUrl: null, callbackUrl: null };
  }
};

export const initiateGoogleAuth = (): void => {
  window.location.href = '/api/auth/google';
};

export const unlinkGoogleAccount = async (): Promise<void> => {
  const response = await fetch('/api/auth/google/unlink', {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unlink Google account');
  }
};
```

#### 2. Enhanced Authentication Context

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkGoogleOAuthStatus, unlinkGoogleAccount, GoogleOAuthStatus } from '../lib/auth/googleOAuth';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'EXPLORER' | 'ABROADER';
  avatar?: string;
  // ... other user properties
  googleId?: string; // Indicates if Google account is linked
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData, avatar?: File) => Promise<void>;
  loading: boolean;
  // Google OAuth methods
  googleOAuthStatus: GoogleOAuthStatus;
  unlinkGoogle: () => Promise<void>;
  refreshGoogleStatus: () => Promise<void>;
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
  const [googleOAuthStatus, setGoogleOAuthStatus] = useState<GoogleOAuthStatus>({
    configured: false,
    authUrl: null,
    callbackUrl: null
  });

  // Initialize auth state and check Google OAuth status
  useEffect(() => {
    const initializeAuth = async () => {
      await Promise.all([
        checkAuthStatus(),
        refreshGoogleStatus()
      ]);
    };
    
    initializeAuth();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      } else if (response.status === 401) {
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshGoogleStatus = async () => {
    const status = await checkGoogleOAuthStatus();
    setGoogleOAuthStatus(status);
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
        await checkAuthStatus();
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const updateProfile = async (data: UpdateProfileData, avatar?: File) => {
    const formData = new FormData();
    
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

  const unlinkGoogle = async () => {
    await unlinkGoogleAccount();
    // Refresh user data to reflect the change
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      refreshToken,
      updateProfile,
      loading,
      googleOAuthStatus,
      unlinkGoogle,
      refreshGoogleStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3. Google OAuth Button Component

```typescript
// components/GoogleAuthButton.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { initiateGoogleAuth } from '../lib/auth/googleOAuth';

interface GoogleAuthButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ 
  className = '', 
  children = 'Continue with Google',
  variant = 'secondary',
  size = 'md'
}) => {
  const { googleOAuthStatus } = useAuth();

  const handleGoogleAuth = () => {
    if (googleOAuthStatus.configured) {
      initiateGoogleAuth();
    }
  };

  // Don't render if Google OAuth is not configured
  if (!googleOAuthStatus.configured) {
    return null;
  }

  const baseClasses = "flex items-center justify-center border rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {children}
    </button>
  );
};

export default GoogleAuthButton;
```

#### 4. Enhanced Login Form

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

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
    <div className="space-y-6">
      {/* Google OAuth Button */}
      <GoogleAuthButton className="w-full" />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
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
    </div>
  );
};

export default LoginForm;
```

#### 5. Profile Management with Google OAuth

```typescript
// components/ProfileSettings.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileSettings: React.FC = () => {
  const { user, unlinkGoogle } = useAuth();
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState('');

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to unlink your Google account? Make sure you have a password set first.')) {
      return;
    }

    setUnlinking(true);
    setError('');

    try {
      await unlinkGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to unlink Google account');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Account Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Google Account</h3>
        
        {user?.googleId ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Google account linked</p>
                <p className="text-sm text-gray-500">You can sign in with Google</p>
              </div>
            </div>
            
            <button
              onClick={handleUnlinkGoogle}
              disabled={unlinking}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {unlinking ? 'Unlinking...' : 'Unlink'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">No Google account linked</p>
                <p className="text-sm text-gray-500">Link your Google account for easier sign in</p>
              </div>
            </div>
            
            {/* You could add a link Google functionality here */}
            <p className="text-sm text-gray-500">Use Google sign in to link account</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
```

### Vue.js Implementation

#### OAuth Service (Composition API)

```typescript
// composables/useGoogleOAuth.ts
import { ref, reactive } from 'vue';

interface GoogleOAuthStatus {
  configured: boolean;
  authUrl: string | null;
  callbackUrl: string | null;
}

const googleOAuthStatus = reactive<GoogleOAuthStatus>({
  configured: false,
  authUrl: null,
  callbackUrl: null
});

export const useGoogleOAuth = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const checkGoogleOAuthStatus = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/auth/google/status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check OAuth status');
      }
      
      const result = await response.json();
      Object.assign(googleOAuthStatus, result.data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error checking Google OAuth status:', err);
    } finally {
      loading.value = false;
    }
  };

  const initiateGoogleAuth = () => {
    if (googleOAuthStatus.configured) {
      window.location.href = '/api/auth/google';
    }
  };

  const unlinkGoogleAccount = async () => {
    const response = await fetch('/api/auth/google/unlink', {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to unlink Google account');
    }
  };

  return {
    googleOAuthStatus: readonly(googleOAuthStatus),
    loading: readonly(loading),
    error: readonly(error),
    checkGoogleOAuthStatus,
    initiateGoogleAuth,
    unlinkGoogleAccount
  };
};
```

#### Google Auth Button Component

```vue
<!-- components/GoogleAuthButton.vue -->
<template>
  <button
    v-if="googleOAuthStatus.configured"
    @click="handleGoogleAuth"
    :class="buttonClasses"
    type="button"
  >
    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
    <slot>Continue with Google</slot>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useGoogleOAuth } from '../composables/useGoogleOAuth';

interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  class: ''
});

const { googleOAuthStatus, checkGoogleOAuthStatus, initiateGoogleAuth } = useGoogleOAuth();

const buttonClasses = computed(() => {
  const baseClasses = "flex items-center justify-center border rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return `${baseClasses} ${variantClasses[props.variant]} ${sizeClasses[props.size]} ${props.class}`;
});

const handleGoogleAuth = () => {
  initiateGoogleAuth();
};

onMounted(() => {
  checkGoogleOAuthStatus();
});
</script>
```

### Angular Implementation

#### Google OAuth Service

```typescript
// services/google-oauth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface GoogleOAuthStatus {
  configured: boolean;
  authUrl: string | null;
  callbackUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleOAuthService {
  private statusSubject = new BehaviorSubject<GoogleOAuthStatus>({
    configured: false,
    authUrl: null,
    callbackUrl: null
  });

  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStatus();
  }

  checkStatus(): Observable<any> {
    return this.http.get('/api/auth/google/status', {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        this.statusSubject.next(response.data);
      }),
      catchError((error) => {
        console.error('Error checking Google OAuth status:', error);
        this.statusSubject.next({ configured: false, authUrl: null, callbackUrl: null });
        throw error;
      })
    );
  }

  initiateGoogleAuth(): void {
    const currentStatus = this.statusSubject.value;
    if (currentStatus.configured) {
      window.location.href = '/api/auth/google';
    }
  }

  unlinkGoogleAccount(): Observable<any> {
    return this.http.delete('/api/auth/google/unlink', {
      withCredentials: true
    });
  }

  get isConfigured(): boolean {
    return this.statusSubject.value.configured;
  }
}
```

#### Google Auth Button Component

```typescript
// components/google-auth-button.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { GoogleOAuthService } from '../services/google-oauth.service';

@Component({
  selector: 'app-google-auth-button',
  template: `
    <button 
      *ngIf="isConfigured$ | async"
      (click)="handleGoogleAuth()"
      [class]="buttonClasses"
      type="button">
      <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <!-- Other SVG paths... -->
      </svg>
      <ng-content>Continue with Google</ng-content>
    </button>
  `,
  styleUrls: ['./google-auth-button.component.scss']
})
export class GoogleAuthButtonComponent implements OnInit {
  @Input() variant: 'primary' | 'secondary' = 'secondary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() customClass: string = '';

  isConfigured$ = this.googleOAuthService.status$.pipe(
    map(status => status.configured)
  );

  constructor(private googleOAuthService: GoogleOAuthService) {}

  ngOnInit(): void {
    this.googleOAuthService.checkStatus().subscribe();
  }

  get buttonClasses(): string {
    const baseClasses = "flex items-center justify-center border rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
    
    const variantClasses = {
      primary: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${this.customClass}`;
  }

  handleGoogleAuth(): void {
    this.googleOAuthService.initiateGoogleAuth();
  }
}
```

## 🔄 OAuth Flow Handling

### 1. URL Parameters After OAuth

After successful Google OAuth, users are redirected to your frontend with URL parameters:

```typescript
// Handle OAuth success/error in your router or main component
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const MyApp = () => {
  const router = useRouter();

  useEffect(() => {
    const { welcome, error } = router.query;

    if (welcome === 'true') {
      // New user from Google OAuth
      toast.success('Welcome! Your account has been created successfully.');
      // Maybe show onboarding flow
    }

    if (error) {
      const errorMessages = {
        oauth_failed: 'Google authentication failed. Please try again.',
        oauth_error: 'An error occurred during Google authentication.',
        oauth_denied: 'Google authentication was cancelled.'
      };
      
      toast.error(errorMessages[error as string] || 'Authentication failed');
    }
  }, [router.query]);

  // ... rest of your app
};
```

### 2. Protected Routes

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

## 🚨 Error Handling

### Common OAuth Errors

```typescript
// utils/oauthErrors.ts
export const handleOAuthError = (error: string) => {
  switch (error) {
    case 'oauth_failed':
      return 'Google authentication failed. Please try again.';
    case 'oauth_error':
      return 'An error occurred during authentication. Please try again.';
    case 'oauth_denied':
      return 'Authentication was cancelled. You can try again anytime.';
    case 'account_linking_failed':
      return 'This Google account is already linked to another user.';
    default:
      return 'Authentication failed. Please try again.';
  }
};
```

## 📱 Mobile Considerations

For React Native or mobile web apps:

```typescript
// Mobile OAuth handling
export const handleMobileOAuth = () => {
  if (typeof window !== 'undefined') {
    // Check if running in mobile app webview
    const isApp = window.navigator.userAgent.includes('YourAppName');
    
    if (isApp) {
      // Handle OAuth differently for mobile app
      window.location.href = '/api/auth/google';
    } else {
      // Regular web OAuth
      initiateGoogleAuth();
    }
  }
};
```

## 🔧 Development Setup

1. **Environment Variables**:
```env
# Add to your .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

2. **CORS Configuration**:
Make sure your backend CORS settings include your frontend URL.

3. **Testing**:
```typescript
// Test OAuth status
const testOAuth = async () => {
  const status = await checkGoogleOAuthStatus();
  console.log('OAuth configured:', status.configured);
};
```

## 📋 Checklist

### Frontend Implementation Checklist

- [ ] Install and configure authentication context
- [ ] Add Google OAuth status checking
- [ ] Implement Google OAuth button component  
- [ ] Add OAuth button to login/register forms
- [ ] Handle OAuth callback URL parameters
- [ ] Add profile management for Google account linking/unlinking
- [ ] Implement error handling for OAuth failures
- [ ] Test OAuth flow in development
- [ ] Configure production URLs
- [ ] Test production deployment

### Testing Checklist

- [ ] Google OAuth button only shows when configured
- [ ] OAuth initiation redirects to Google
- [ ] Successful OAuth creates/links account and sets cookies
- [ ] Failed OAuth shows appropriate error message
- [ ] New users get welcome message
- [ ] Existing users are logged in normally
- [ ] Account unlinking works (with password protection)
- [ ] OAuth works in both development and production

This implementation provides a complete, production-ready Google OAuth integration that maintains security best practices and provides excellent user experience!