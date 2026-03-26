'use client';

import { BottomNavBar } from '@/components/app/BottomNavBar';
import { AppHeader } from '@/components/app/AppHeader';
import { ProtectedRoute } from '@/components/app/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { ProfileProvider } from '@/providers/ProfileProvider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSearch = pathname === '/dashboard';
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
