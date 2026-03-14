import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
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
    icon: '/sidra-logo.png',
    apple: '/sidra-logo.png',
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
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
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then((registration) => {
                      console.log('[PWA] Service Worker registered:', registration);
                      
                      // Check for updates every 60 seconds
                      setInterval(() => {
                        registration.update();
                      }, 60000);
                      
                      // Listen for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('[PWA] New service worker available, notifying...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      });
                      
                      // Listen for service worker taking control
                      navigator.serviceWorker.addEventListener('controllerchange', () => {
                        console.log('[PWA] New service worker is now controlling the page, reloading...');
                        window.location.reload();
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
          <PWAInstallPrompt />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
