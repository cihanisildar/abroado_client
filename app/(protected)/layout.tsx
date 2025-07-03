'use client';

import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { connectSocket } from '@/lib/socket'

// Note: Since this is now a client component, metadata should be set in a parent server component
// export const metadata: Metadata = {
//   title: 'Gurbetci Community',
//   description: 'Connect with people living abroad',
// }

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Establish socket connection once authenticated
    if (!isLoading && isAuthenticated) {
      connectSocket();
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Since middleware handles auth checks, we can trust we're authenticated here
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {children}
      </main>
    </div>
  )
} 