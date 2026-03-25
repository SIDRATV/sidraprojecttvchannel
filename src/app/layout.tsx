import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sidra Project TV Channel | Premium Islamic Media Streaming',
  description:
    'Experience premium Islamic media showcasing innovative projects within the Sidra ecosystem. Documentaries, tutorials, and inspirational content.',
  keywords: [
    'Islamic media',
    'Streaming platform',
    'Documentary',
    'Sidra ecosystem',
    'Premium content',
  ],
  authors: [{ name: 'Sidra Project' }],
  creator: 'Sidra Team',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sidra TV',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/sidra-logo-v2.png',
    apple: '/sidra-logo-v2.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sidra.tv',
    title: 'Sidra Project TV Channel',
    description: 'Premium Islamic media streaming platform',
    siteName: 'Sidra TV',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sidra TV" />
        
        {/* AGGRESSIVE Cache Control Meta Tags - Forces browser to ALWAYS validate */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        <link rel="manifest" href="/manifest.json?v=1.0.0" />
        <link rel="icon" href="/sidra-logo-v2.png" />
        <link rel="apple-touch-icon" href="/sidra-logo-v2.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme ? theme === 'dark' : prefersDark;
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  console.log('[PWA] Starting service worker registration...');

                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then((registration) => {
                      console.log('[PWA] Service Worker registered:', registration);

                      registration.update().catch(() => undefined);

                      // Listen for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;

                        if (!newWorker) return;

                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New service worker available. It will activate on next full reload.');
                          }
                        });
                      });
                    })
                    .catch((error) => {
                      console.log('[PWA] Service worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-950 dark:text-white transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            <PWAInstallPrompt />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
