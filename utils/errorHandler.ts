/**
 * API Error Handler Utility
 * 
 * This utility provides centralized error handling for API responses across the application.
 * It automatically maps technical error messages to user-friendly messages and handles
 * different error response formats.
 * 
 * Usage Examples:
 * 
 * 1. Using specific error handlers:
 *    try {
 *      await login.mutateAsync(credentials);
 *    } catch (error) {
 *      handleLoginError(error);
 *    }
 * 
 * 2. Using generic error handler with context:
 *    try {
 *      await updateProfile.mutateAsync(data);
 *    } catch (error) {
 *      handleApiError(error, 'profile update');
 *    }
 * 
 * 3. Using custom context:
 *    try {
 *      await customApiCall();
 *    } catch (error) {
 *      handleApiError(error, 'custom operation');
 *    }
 * 
 * Error Message Mapping:
 * - Authentication errors (login, register, etc.) get user-friendly auth messages
 * - System errors (network, server, etc.) get appropriate technical guidance
 * - Unknown errors fall back to generic messages with context
 * 
 * Supported Error Formats:
 * - { success: false, message: "...", error: "..." }
 * - { success: false, message: "...", details: "..." }
 * - Axios error responses
 * - Generic error objects with message property
 */

import toast from 'react-hot-toast';

// Type definitions for different error formats
interface ApiErrorResponse {
  success: boolean;
  message: string;
  error: string;
}

interface FlexibleApiError {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message: string;
    };
  };
}

interface ErrorResponse {
  message: string;
}

// Type guards
const isApiErrorResponse = (err: unknown): err is ApiErrorResponse => {
  return typeof err === 'object' && err !== null && 'success' in err && 'message' in err && 'error' in err;
};

const isFlexibleApiError = (err: unknown): err is FlexibleApiError => {
  return typeof err === 'object' && err !== null && 'success' in err && (err as any).success === false;
};

const isAxiosErrorResponse = (err: unknown): err is AxiosErrorResponse => {
  return typeof err === 'object' && err !== null && 'response' in err;
};

const isErrorResponse = (err: unknown): err is ErrorResponse => {
  return typeof err === 'object' && err !== null && 'message' in err;
};

// Error message mapping functions
const getAuthErrorMessage = (errorText: string): string => {
  const lowerError = errorText.toLowerCase();
  
  if (lowerError.includes('invalid email') || lowerError.includes('invalid password')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (lowerError.includes('account locked') || lowerError.includes('too many attempts')) {
    return 'Account temporarily locked due to too many failed attempts. Please try again later.';
  }
  if (lowerError.includes('email not verified') || lowerError.includes('verify email')) {
    return 'Please verify your email address before signing in.';
  }
  if (lowerError.includes('account suspended') || lowerError.includes('banned')) {
    return 'Your account has been suspended. Please contact support.';
  }
  if (lowerError.includes('user not found')) {
    return 'No account found with this email address.';
  }
  if (lowerError.includes('password expired')) {
    return 'Your password has expired. Please reset your password.';
  }
  if (lowerError.includes('email already exists') || lowerError.includes('email taken')) {
    return 'An account with this email already exists. Please use a different email or try signing in.';
  }
  if (lowerError.includes('username already exists') || lowerError.includes('username taken')) {
    return 'This username is already taken. Please choose a different username.';
  }
  if (lowerError.includes('weak password') || lowerError.includes('password too weak')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  
  return errorText;
};

const getSystemErrorMessage = (errorText: string): string => {
  const lowerError = errorText.toLowerCase();
  
  if (lowerError.includes('network') || lowerError.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (lowerError.includes('server') || lowerError.includes('maintenance')) {
    return 'Server is temporarily unavailable. Please try again later.';
  }
  if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  if (lowerError.includes('database') || lowerError.includes('db')) {
    return 'Database error. Please try again later.';
  }
  if (lowerError.includes('validation') || lowerError.includes('invalid')) {
    return 'Invalid data provided. Please check your input.';
  }
  
  return errorText;
};

// Main error handler function
export const handleApiError = (error: unknown, context: string = 'operation'): void => {
  console.error(`${context} failed:`, error);
  
  // Handle JSON string errors (from our custom error throwing)
  if (error instanceof Error && error.message) {
    try {
      const parsedError = JSON.parse(error.message);
      if (isApiErrorResponse(parsedError)) {
        const errorText = parsedError.error || parsedError.message;
        const userFriendlyMessage = getAuthErrorMessage(errorText);
        toast.error(userFriendlyMessage);
        return;
      } else if (isFlexibleApiError(parsedError)) {
        const errorText = parsedError.error || parsedError.details || parsedError.message || `An error occurred during ${context}`;
        const userFriendlyMessage = getSystemErrorMessage(errorText);
        toast.error(userFriendlyMessage);
        return;
      }
    } catch (parseError) {
      // If JSON parsing fails, continue with normal error handling
    }
  }
  
  // Improved Axios error extraction
  if (isAxiosErrorResponse(error) && error.response?.data) {
    const data = error.response.data;
    console.log('Axios error.response.data:', data); // Debug log
    let errorText = '';
    if ('error' in data && typeof data.error === 'string') {
      errorText = data.error;
    } else if ('message' in data && typeof data.message === 'string') {
      errorText = data.message;
    } else {
      errorText = JSON.stringify(data);
    }
    const userFriendlyMessage = getAuthErrorMessage(errorText);
    toast.error(userFriendlyMessage);
    return;
  }
  
  if (isApiErrorResponse(error)) {
    const errorText = error.error || error.message;
    const userFriendlyMessage = getAuthErrorMessage(errorText);
    toast.error(userFriendlyMessage);
  } else if (isFlexibleApiError(error)) {
    const errorText = error.error || error.details || error.message || `An error occurred during ${context}`;
    const userFriendlyMessage = getSystemErrorMessage(errorText);
    toast.error(userFriendlyMessage);
  } else if (isErrorResponse(error)) {
    toast.error(error.message);
  } else {
    console.error('Unexpected error format:', error);
    toast.error(`Failed to ${context}. Please try again later.`);
  }
};

// Specific error handlers for common operations
export const handleLoginError = (error: unknown): void => {
  handleApiError(error, 'login');
};

export const handleRegisterError = (error: unknown): void => {
  handleApiError(error, 'registration');
};

export const handleProfileUpdateError = (error: unknown): void => {
  handleApiError(error, 'profile update');
};

export const handlePostError = (error: unknown): void => {
  handleApiError(error, 'post operation');
};

export const handleCommentError = (error: unknown): void => {
  handleApiError(error, 'comment operation');
};

export const handleCityError = (error: unknown): void => {
  handleApiError(error, 'city operation');
};

export const handleRoomError = (error: unknown): void => {
  handleApiError(error, 'room operation');
}; 