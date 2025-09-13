import { api, setRefreshTokenFn } from '@/lib/api';
import { checkGoogleOAuthStatus, unlinkGoogleAccount, type GoogleOAuthStatus } from '@/lib/auth/googleOAuth';
import type {
  LoginRequest,
  RegisterRequest,
  User
} from '@/lib/types';
import type { ApiResponse, AuthResponse } from '@/lib/types/api.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// Profile update response structure
export interface UpdateProfileResponse extends ApiResponse<User> {
  data: User;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [googleOAuthStatus, setGoogleOAuthStatus] = useState<GoogleOAuthStatus>({
    configured: false,
    authUrl: null,
    callbackUrl: null
  });

  // Memoize route checks to prevent unnecessary re-renders
  const routeConfig = useMemo(() => {
    const isAuthRoute = pathname?.startsWith('/auth/') ?? false;
    const publicRoutes = ['/', '/cities', '/posts', '/rooms'];
    const isPublicBrowsingRoute = publicRoutes.some(route =>
      pathname === route || pathname?.startsWith(route + '/')
    );

    return {
      isAuthRoute,
      isPublicBrowsingRoute,
      shouldFetchUser: !isAuthRoute
    };
  }, [pathname]);

  // Initialize Google OAuth status
  useEffect(() => {
    let mounted = true;

    const initGoogleStatus = async () => {
      try {
        if (mounted) {
          await refreshGoogleStatus();
        }
      } catch (error) {
        console.warn('Failed to initialize Google OAuth status:', error);
      }
    };

    initGoogleStatus();

    return () => {
      mounted = false;
    };
  }, []);

  // Login mutation
  const login = useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    },
    onSuccess: (response) => {
      const authResponse = response as AuthResponse;
      queryClient.setQueryData(['auth', 'user'], authResponse.data.user);
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
    },
  });

  // Register mutation
  const register = useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: async (userData) => {
      const response = await api.post('/auth/register', userData);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    },
    onSuccess: (response) => {
      const authResponse = response as AuthResponse;
      queryClient.setQueryData(['auth', 'user'], authResponse.data.user);
    },
    onError: (error) => {
      console.error('Registration failed:', error.message);
    },
  });

  // Refresh mutation
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // Register refresh function with API interceptor
  useEffect(() => {
    setRefreshTokenFn(() => refresh.mutateAsync());

    return () => {
      setRefreshTokenFn(null);
    };
  }, [refresh.mutateAsync]);

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
    onError: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
  });

  // Profile update mutation
  const updateProfile = useMutation<UpdateProfileResponse, Error, FormData>({
    mutationFn: async (formData) => {
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['auth', 'user'], response.data);
    },
  });

  // Unlink Google mutation
  const unlinkGoogle = useMutation({
    mutationFn: unlinkGoogleAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // Refresh Google status function
  const refreshGoogleStatus = async () => {
    const status = await checkGoogleOAuthStatus();
    setGoogleOAuthStatus(status);
  };

  // User query - the main authentication check
  const getCurrentUser = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/profile');
        const userData = response.data.data || response.data;
        return userData;
      } catch (error) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            return null;
          }
        }
        return null;
      }
    },
    enabled: routeConfig.shouldFetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(() => ({
    // Mutations
    login,
    register,
    refresh,
    logout,
    updateProfile,
    unlinkGoogle,

    // User data
    user: getCurrentUser.data,
    isLoading: getCurrentUser.isLoading,
    isAuthenticated: !!getCurrentUser.data,

    // Google OAuth
    googleOAuthStatus,
    refreshGoogleStatus,

    // Route information
    ...routeConfig,
  }), [
    login,
    register,
    refresh,
    logout,
    updateProfile,
    unlinkGoogle,
    getCurrentUser.data,
    getCurrentUser.isLoading,
    googleOAuthStatus,
    routeConfig
  ]);
};