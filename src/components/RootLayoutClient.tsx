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
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const splashShown = sessionStorage.getItem('splash-shown');
    if (splashShown) {
      setShowSplash(false);
      setShowContent(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash-shown', 'true');
    setShowSplash(false);
    setShowContent(true);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={showSplash ? 'hidden' : ''}>
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
      </div>
    </>
  );
}
