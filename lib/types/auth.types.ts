/**
 * Authentication and authorization types
 */

import type { User, UserRole } from './entities.types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface ProtectedActionOptions {
  redirectTo?: string;
  onUnauthenticated?: () => void;
}

export interface UseAuthActionResult {
  requireAuth: (action: () => void) => void;
  isAuthenticated: boolean;
  user: User | null;
}

export interface SessionData {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED';
  statusCode: number;
}

export interface AuthRedirect {
  redirectTo: string;
  message?: string;
}

// Server-side auth types
export interface ServerAuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}