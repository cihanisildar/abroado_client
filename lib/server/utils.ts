/**
 * Shared utilities for server-side API calls
 */

import { cookies } from 'next/headers';
import { ApiResponse } from '@/lib/types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

export async function serverFetch<T>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = false, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  // Add auth headers if required
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (requireAuth) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('gb_accessToken')?.value;
    const refreshToken = cookieStore.get('gb_refreshToken')?.value;
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Include cookies for session-based auth
    if (refreshToken) {
      headers['Cookie'] = `gb_refreshToken=${refreshToken}${accessToken ? `; gb_accessToken=${accessToken}` : ''}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      // Don't include credentials for server-side requests to avoid CORS issues
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new ServerApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    const data = await response.json();
    
    // Handle standard API response format
    if (data.success !== undefined) {
      const apiResponse = data as ApiResponse<T>;
      if (!apiResponse.success) {
        throw new ServerApiError(apiResponse.message, response.status, data);
      }
      return apiResponse.data;
    }
    
    return data;
  } catch (error) {
    if (error instanceof ServerApiError) {
      throw error;
    }
    
    throw new ServerApiError(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      error
    );
  }
}

// Utility functions for error handling
export function isServerApiError(error: unknown): error is ServerApiError {
  return error instanceof ServerApiError;
}

export function handleServerApiError(error: unknown): {
  message: string;
  status: number;
  isNotFound: boolean;
  isUnauthorized: boolean;
} {
  if (isServerApiError(error)) {
    return {
      message: error.message,
      status: error.status,
      isNotFound: error.status === 404,
      isUnauthorized: error.status === 401 || error.status === 403,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Unknown server error',
    status: 500,
    isNotFound: false,
    isUnauthorized: false,
  };
}

// Helper for building query strings
export function buildQueryString(params: Record<string, string | number | boolean | string[] | number[] | boolean[] | null | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}