// api.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔑 SECURITY: Always include httpOnly cookies for authentication
});

// Store reference to refresh function
let refreshTokenFn: (() => Promise<AuthResponse>) | null = null;

// Function to set the refresh function from the hook
export const setRefreshTokenFn = (fn: (() => Promise<AuthResponse>) | null) => {
  refreshTokenFn = fn;
};

let isRefreshing = false;
interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  
  failedQueue = [];
};

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') || 
                          originalRequest.url?.includes('/auth/refresh');

    // Handle both 401 (Unauthorized) and 403 (Forbidden) for auth errors
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the refresh function from the hook if available
        if (refreshTokenFn) {
          await refreshTokenFn();
        } else {
          // Fallback to direct API call using httpOnly cookies
          await api.post('/auth/refresh');
        }
        
        // If refresh successful, process queued requests
        processQueue(null);
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear any stale auth state
        processQueue(refreshError);
        
        // Redirect to login page if we're in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
); 