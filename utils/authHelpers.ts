import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export interface UseAuthActionOptions {
  redirectTo?: string;
}

export const useAuthAction = (options: UseAuthActionOptions = {}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const { redirectTo } = options;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      // Redirect immediately without showing toast
      const currentPath = redirectTo || window.location.pathname + window.location.search;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }
    action();
  };

  return { requireAuth, isAuthenticated };
};

export const redirectToLogin = (redirectTo?: string) => {
  const currentPath = redirectTo || window.location.pathname + window.location.search;
  window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;
};