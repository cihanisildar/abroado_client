'use client';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Header is now handled by the root layout via HeaderWrapper
  return <>{children}</>;
} 