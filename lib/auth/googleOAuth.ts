import { api } from '@/lib/api';

export interface GoogleOAuthStatus {
  configured: boolean;
  authUrl: string | null;
  callbackUrl: string | null;
}

export const checkGoogleOAuthStatus = async (): Promise<GoogleOAuthStatus> => {
  try {
    const response = await api.get('/auth/google/status');
    
    if (!response.data.success) {
      throw new Error('Failed to check OAuth status');
    }
    
    return response.data.data;
  } catch (error) {
    // Silently fail when backend is not running during development
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      console.warn('Backend server not running - Google OAuth disabled');
    } else {
      console.error('Error checking Google OAuth status:', error);
    }
    return { configured: false, authUrl: null, callbackUrl: null };
  }
};

export const initiateGoogleAuth = (): void => {
  try {
    console.log('Initiating Google OAuth redirect...');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const redirectUrl = `${API_BASE_URL}/api/auth/google`;
    console.log('Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
  }
};

export const unlinkGoogleAccount = async (): Promise<void> => {
  const response = await api.delete('/auth/google/unlink');
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to unlink Google account');
  }
};

export const handleOAuthError = (error: string): string => {
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