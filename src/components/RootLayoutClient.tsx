'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { MiniPlayerProvider } from '@/providers/MiniPlayerProvider';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MiniPlayer } from '@/components/MiniPlayer';
import { SplashScreen } from '@/components/SplashScreen';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const splashShown = sessionStorage.getItem('splash-shown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash-shown', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <ThemeProvider>
        <MiniPlayerProvider>
          <AuthProvider>
            <QueryProvider>
              <PWAInstallPrompt />
              {children}
              <MiniPlayer />
            </QueryProvider>
          </AuthProvider>
        </MiniPlayerProvider>
      </ThemeProvider>
    </>
  );
}
