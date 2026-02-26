'use client';

import { BottomNavBar } from '@/components/app/BottomNavBar';
import { AppHeader } from '@/components/app/AppHeader';
import { ProtectedRoute } from '@/components/app/ProtectedRoute';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </ProtectedRoute>
  );
}
