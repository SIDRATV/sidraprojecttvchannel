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

  // No user → loading spinner while auth confirms / redirect in flight
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-800 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

