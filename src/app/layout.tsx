import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Web3ModalProvider } from '@/providers/Web3ModalProvider';
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
        
        {/* Cache Control Meta Tags - Force browser to check for updates on every page load */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        <link rel="manifest" href="/manifest.json?v=1.0.0" />
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
                  console.log('[PWA] Starting service worker registration...');
                  
                  // Force fresh manifest with cache-busting
                  const manifestLink = document.querySelector('link[rel="manifest"]');
                  if (manifestLink) {
                    const currentHref = manifestLink.getAttribute('href');
                    const version = '${new Date().toISOString().slice(0, 10)}';
                    manifestLink.setAttribute('href', currentHref.split('?')[0] + '?v=' + version);
                    console.log('[PWA] Manifest updated with version:', version);
                  }
                  
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
        
        {/* Force Cache Busting on Every Page Load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force browsers to validate cache on every visit
              window.addEventListener('load', () => {
                console.log('[Cache Busting] Forcing cache validation...');
                
                // Add timestamp to all script and link tags for cache busting
                const timestamp = Date.now();
                
                // For all future fetches, add cache-busting parameter
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  let [resource, config] = args;
                  if (typeof resource === 'string') {
                    const separator = resource.includes('?') ? '&' : '?';
                    // Add cache-busting to API calls and HTML fetches
                    if (resource.includes('/api/') || resource.endsWith('.html')) {
                      resource = resource + separator + '_t=' + timestamp;
                    }
                  }
                  return originalFetch.apply(this, [resource, config]);
                };
                
                // Force validation of cached resources
                if ('caches' in window) {
                  caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                      caches.open(cacheName).then(cache => {
                        cache.keys().then(requests => {
                          requests.forEach(request => {
                            // Don't cache API requests aggressively
                            if (request.url.includes('/api/')) {
                              cache.delete(request);
                            }
                          });
                        });
                      });
                    });
                  });
                }
                
                console.log('[Cache Busting] Cache validation complete');
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-950 dark:text-white transition-colors duration-300`}>
        <Web3ModalProvider>
          <ThemeProvider>
            <PWAInstallPrompt />
            {children}
          </ThemeProvider>
        </Web3ModalProvider>
      </body>
    </html>
  );
}
