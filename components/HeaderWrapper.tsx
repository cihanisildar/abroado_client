'use client';

/**
 * HeaderWrapper - Intelligently shows the appropriate header based on route and auth status
 */

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from './Header';
import { PublicHeader } from './PublicHeader';

export function HeaderWrapper() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Don't show header on auth pages (they have their own minimal header)
  const isAuthPage = pathname?.startsWith('/auth/');
  if (isAuthPage) {
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-32 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show appropriate header based on authentication status
  return isAuthenticated ? <Header /> : <PublicHeader />;
}