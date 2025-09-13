'use client';

/**
 * AuthGate component - Wraps actions that require authentication
 * Shows login prompt for unauthenticated users
 */

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { AuthGateProps } from '@/lib/types/auth.types';

export function AuthGate({ 
  children, 
  fallback, 
  redirectTo,
  requireAuth = true 
}: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const handleUnauthenticated = () => {
    // Redirect immediately without showing toast
    const currentPath = redirectTo || window.location.pathname + window.location.search;
    router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-20"></div>
    );
  }

  // Show fallback for unauthenticated users
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div onClick={handleUnauthenticated} className="cursor-pointer">
        {children}
      </div>
    );
  }

  // Render children for authenticated users or when auth is not required
  return <>{children}</>;
}

// Hook version for programmatic usage
export function useAuthGate() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const requireAuth = (
    action: () => void,
    options: {
      redirectTo?: string;
    } = {}
  ) => {
    if (!isAuthenticated) {
      // Redirect immediately without showing toast
      const currentPath = options.redirectTo || window.location.pathname + window.location.search;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    action();
  };

  const requireRole = (
    action: () => void,
    allowedRoles: string[],
    options: {
      redirectTo?: string;
    } = {}
  ) => {
    if (!isAuthenticated) {
      return requireAuth(action, options);
    }

    if (user && !allowedRoles.includes(user.role)) {
      // For role-based restrictions, we might want to show an error or redirect to a different page
      // For now, just ignore the action - this could be customized based on requirements
      console.warn(`User ${user.username} does not have required role. Required: ${allowedRoles.join(', ')}, Has: ${user.role}`);
      return;
    }

    action();
  };

  return {
    requireAuth,
    requireRole,
    isAuthenticated,
    isLoading,
    user,
  };
}