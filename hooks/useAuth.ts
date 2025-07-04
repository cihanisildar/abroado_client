import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setRefreshTokenFn } from '@/lib/api';
import { LoginResponse, LoginRequest, RegisterRequest, RegisterResponse, User } from '@/lib/types';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Updated profile payload structure to align with backend expectation
export interface UpdateProfileRequest {
  username: string;
  bio?: string;
  currentCity: string;
  currentCountry: string;
  targetCountry?: string;
  techStack?: string; // e.g. "JavaScript, Node.js, React"
  avatar?: string; // avatar image URL
}

// Profile update response structure
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith('/auth/');

  const login = useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        const data = response.data;
        // Check if the response indicates failure
        if (!data.success) {
          return Promise.reject(data);
        }
        return data;
      } catch (error: any) {
        // Handle Axios errors (401, 403, etc.) that still have response data
        if (error.response?.data) {
          return Promise.reject(error.response.data);
        }
        // Re-throw other errors as-is
        throw error;
      }
    },
    onSuccess: (data) => {
      // Set user data in React Query cache - token is in httpOnly cookie
      queryClient.setQueryData(['auth', 'user'], data.data.user);
    },
    onError: () => {},
  });

  const register = useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        const data = response.data;
        
        // Check if the response indicates failure
        if (!data.success) {
          throw new Error(JSON.stringify(data));
        }
        
        return data;
      } catch (error: any) {
        // Handle Axios errors (400, 401, etc.) that still have response data
        if (error.response?.data) {
          throw new Error(JSON.stringify(error.response.data));
        }
        
        // Re-throw other errors as-is
        throw error;
      }
    },
    onSuccess: (data) => {
      // Backend handles auto-login, so set user data in cache
      queryClient.setQueryData(['auth', 'user'], data.data.user);
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // Register refresh function with API interceptor
  useEffect(() => {
    // Always register the refresh function, regardless of route type
    // This ensures token refresh works when navigating between public/protected routes
    setRefreshTokenFn(() => refresh.mutateAsync());
    
    return () => {
      setRefreshTokenFn(null);
    };
  }, [refresh.mutateAsync]);

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    },
    onSuccess: () => {
      // Clear user data from React Query cache (cookie cleared by server)
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
  });

  // Profile update mutation: uploads multipart/form-data (incl. avatar)
  const updateProfile = useMutation<UpdateProfileResponse, Error, FormData>({
    mutationFn: async (formData) => {
      // Retrieve access token from cookie (not httpOnly)
      let token: string | undefined;
      if (typeof document !== 'undefined') {
        const match = document.cookie
          .split('; ')
          .find((row) => row.startsWith('gb_accessToken='));
        if (match) token = match.split('=')[1];
      }

      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.data;
    },
    onSuccess: (response) => {
      // Update cached user immediately with the user data from the response
      queryClient.setQueryData(['auth', 'user'], response.data);
    },
  });

  const getCurrentUser = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        // Check authentication status with server
        const response = await api.get('/auth/profile');
        const userData = response.data.data || response.data;
        return userData;
      } catch (error: any) {
        // If token is expired/invalid (403/401), the API interceptor will handle the redirect
        // For other errors, just return null
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication failed - token expired or invalid');
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth requests
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true, // Allow refetch on mount to ensure fresh data
    refetchOnReconnect: false, // Don't refetch on reconnect
    enabled: !isPublicRoute, // Only run query on protected routes
  });

  return {
    login,
    register,
    refresh,
    logout,
    updateProfile,
    user: getCurrentUser.data,
    isLoading: getCurrentUser.isLoading,
    isAuthenticated: !!getCurrentUser.data,
  };
}; 