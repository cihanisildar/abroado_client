import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { handleOAuthError } from '@/lib/auth/googleOAuth';

export interface OAuthCallbackParams {
  welcome?: string;
  error?: string;
}

export const useOAuthCallbackHandler = () => {
  const router = useRouter();

  useEffect(() => {
    // Check URL parameters for OAuth callback results
    const urlParams = new URLSearchParams(window.location.search);
    const welcome = urlParams.get('welcome');
    const error = urlParams.get('error');

    if (welcome === 'true') {
      toast.success('Welcome! Your account has been created successfully with Google. 🎉');
      // Redirect to homepage after successful OAuth
      router.push('/');
    }

    if (error) {
      const errorMessage = handleOAuthError(error);
      toast.error(errorMessage);
      // Redirect to homepage even on error to avoid staying on callback page
      router.push('/');
    }
  }, [router]);
};

export const handleOAuthCallback = (params: OAuthCallbackParams) => {
  const { welcome, error } = params;

  if (welcome === 'true') {
    toast.success('Welcome! Your account has been created successfully with Google. 🎉');
    // Note: This function doesn't have access to router, so redirect should be handled by the caller
  }

  if (error) {
    const errorMessage = handleOAuthError(error);
    toast.error(errorMessage);
    // Note: This function doesn't have access to router, so redirect should be handled by the caller
  }
};