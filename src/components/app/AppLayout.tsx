'use client';

import { useEffect, useRef } from 'react';
import { BottomNavBar } from '@/components/app/BottomNavBar';
import { AppHeader } from '@/components/app/AppHeader';
import { ProtectedRoute } from '@/components/app/ProtectedRoute';
import { BlockedUserScreen } from '@/components/app/BlockedUserScreen';
import { usePathname, useRouter } from 'next/navigation';
import { ProfileProvider } from '@/providers/ProfileProvider';
import { useAuth } from '@/hooks/useAuth';

const MAINTENANCE_POLL_MS = 30_000; // check every 30s

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = pathname === '/dashboard';
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Client-side maintenance check — middleware only runs on hard navigations
  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
        // Send auth token so API can check exemption
        const { data: { session: s } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
        if (s?.access_token) {
          headers['Authorization'] = `Bearer ${s.access_token}`;
        }
        const res = await fetch('/api/maintenance', { cache: 'no-store', headers });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.enabled && !data.isExempt) {
          router.replace('/maintenance');
        }
      } catch { /* ignore network errors */ }
    };

    // Check once on mount / route change
    check();

    // Poll periodically
    intervalRef.current = setInterval(check, MAINTENANCE_POLL_MS);

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, router]);

  // Block banned users from accessing any page
  if (user?.is_blocked) {
    return <BlockedUserScreen reason={user.block_reason} />;
  }

  return (
    <ProfileProvider>
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
          <AppHeader showSearch={showSearch} />
          <main className="flex-1 overflow-y-auto pb-24 isolate">
            {children}
          </main>
          <BottomNavBar />
        </div>
      </ProtectedRoute>
    </ProfileProvider>
  );
}
