'use client';

import { useEffect, useState, useCallback } from 'react';
import { BottomNavBar } from '@/components/app/BottomNavBar';
import { AppHeader } from '@/components/app/AppHeader';
import { ProtectedRoute } from '@/components/app/ProtectedRoute';
import { BlockedUserScreen } from '@/components/app/BlockedUserScreen';
import { NotificationToastContainer } from '@/components/app/NotificationToastContainer';
import { usePathname } from 'next/navigation';
import { ProfileProvider } from '@/providers/ProfileProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { swrFetch } from '@/lib/clientCache';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSearch = pathname === '/dashboard';
  const { user } = useAuth();
  const [maintenanceRedirecting, setMaintenanceRedirecting] = useState(false);

  const checkMaintenance = useCallback(async () => {
    try {
      // swrFetch with a fixed cache key so repeated calls return the cached result.
      // The API no longer requires authentication — exemptions are enforced by middleware.
      const data = await swrFetch<any>(
        '/api/maintenance',
        {},
        30_000,
        10 * 60_000,     // stale data acceptable for up to 10 min
        '/api/maintenance' // stable cache key
      );
      if (data?.enabled) {
        setMaintenanceRedirecting(true);
        window.location.href = '/maintenance';
      }
    } catch { /* ignore network errors */ }
  }, []);

  // Check once on mount / route change
  useEffect(() => {
    checkMaintenance();
  }, [checkMaintenance]);

  // Supabase Realtime: react instantly when admin toggles maintenance mode
  useEffect(() => {
    const channel = supabase
      .channel('maintenance_mode_watch')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode',
        },
        () => {
          // Re-check via API to get correct exemption status for this user
          checkMaintenance();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [checkMaintenance]);

  // Show nothing while redirecting to maintenance
  if (maintenanceRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Block banned users from accessing any page
  if (user?.is_blocked) {
    return <BlockedUserScreen reason={user.block_reason} />;
  }

  return (
    <ProfileProvider>
      <ProtectedRoute>
        <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
          <AppHeader showSearch={showSearch} />          <NotificationToastContainer />          <main className="flex-1 overflow-y-auto pb-24 isolate">
            {children}
          </main>
          <BottomNavBar />
        </div>
      </ProtectedRoute>
    </ProfileProvider>
  );
}
