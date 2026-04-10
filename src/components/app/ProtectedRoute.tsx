'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Auth is ready and no user → redirect to login immediately
    if (initialized && !loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/login');
    }
  }, [initialized, user, loading, router]);

  // No user → blank screen (redirect is in flight)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950" />
    );
  }

  return <>{children}</>;
}

