'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Track how long we've been done loading with no user
  const noUserSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      noUserSinceRef.current = null;
      return;
    }

    if (!user) {
      // Record when loading finished with no user
      if (noUserSinceRef.current === null) {
        noUserSinceRef.current = Date.now();
      }

      // Only redirect after 300ms with no user — avoids redirect on brief
      // flicker between getSession() resolving and profile being set
      const delay = setTimeout(() => {
        if (!user) {
          router.push('/login');
        }
      }, 300);

      return () => clearTimeout(delay);
    } else {
      noUserSinceRef.current = null;
    }
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    // Show spinner while the 300ms redirect delay is pending
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return <>{children}</>;
}

