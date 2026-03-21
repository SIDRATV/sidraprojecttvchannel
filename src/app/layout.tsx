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
        
        {/* AGGRESSIVE Cache Control Meta Tags - Forces browser to ALWAYS validate */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
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
        
        {/* AGGRESSIVE Cache Busting & Update Detection System */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const log = (msg) => console.log('[SIDRA Cache Control] ' + msg);
                const CACHE_VERSION_KEY = 'sidra_app_cache_version';
                const LAST_CHECK_KEY = 'sidra_last_cache_check';

                // ============ CHECK FOR APP UPDATES ============
                async function checkForUpdates() {
                  try {
                    log('Checking for app updates...');
                    const response = await fetch('/', {
                      method: 'HEAD',
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                      }
                    });

                    const etag = response.headers.get('etag');
                    const lastModified = response.headers.get('last-modified');
                    const currentVersion = lastModified || etag || Date.now().toString();

                    const storedVersion = sessionStorage.getItem(CACHE_VERSION_KEY);

                    if (storedVersion && storedVersion !== currentVersion) {
                      log('🔄 UPDATE DETECTED! App has been updated. Clearing all caches...');
                      // Clear all caches
                      if ('caches' in window) {
                        const names = await caches.keys();
                        await Promise.all(names.map(name => caches.delete(name)));
                      }
                      // Reload page to get fresh content
                      sessionStorage.setItem(CACHE_VERSION_KEY, currentVersion);
                      window.location.reload();
                      return;
                    }

                    sessionStorage.setItem(CACHE_VERSION_KEY, currentVersion);
                    log('Version check OK: ' + currentVersion.substring(0, 20));
                  } catch (err) {
                    log('Update check error: ' + err.message);
                  }
                }

                // ============ INTERCEPT FETCH FOR CACHE BUSTING ============
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  let [resource, config = {}] = args;

                  if (typeof resource === 'string') {
                    // Only add cache-busting to local API calls, NOT Supabase or external APIs
                    const isLocalApi = resource.startsWith('/') || resource.includes(window.location.hostname);
                    const isSupabase = resource.includes('supabase.co');
                    const isNextStatic = resource.includes('_next/static') || resource.includes('_next/image');

                    if (isLocalApi && !isSupabase && !isNextStatic) {
                      const separator = resource.includes('?') ? '&' : '?';
                      const timestamp = Date.now();
                      resource = resource + separator + 'v=' + timestamp;
                    }

                    // Force no-cache headers for local requests only
                    if (isLocalApi && !isSupabase) {
                      config.headers = config.headers || {};
                      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                      config.headers['Pragma'] = 'no-cache';
                    }
                  }

                  return originalFetch.apply(this, [resource, config]);
                };

                // ============ CLEAR SERVICE WORKER CACHE ON INTERVAL ============
                async function clearOldCaches() {
                  if ('caches' in window) {
                    try {
                      const cacheNames = await caches.keys();
                      for (const name of cacheNames) {
                        const cache = await caches.open(name);
                        const requests = await cache.keys();
                        // Delete API cache entries (they change frequently)
                        const deletePromises = requests
                          .filter(req => req.url.includes('/api/') || req.url.includes('.json'))
                          .map(req => cache.delete(req));
                        await Promise.all(deletePromises);
                      }
                      log('Cleared old API caches');
                    } catch (err) {
                      log('Cache clear error: ' + err.message);
                    }
                  }
                }

                // ============ ON PAGE LOAD ============
                window.addEventListener('load', () => {
                  log('Page loaded - Starting cache validation...');

                  // Check for updates immediately
                  checkForUpdates();

                  // Check again every 30 seconds
                  setInterval(checkForUpdates, 30000);

                  // Clear old caches every minute
                  setInterval(clearOldCaches, 60000);

                  // On page visibility change, check for updates
                  document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                      log('Page became visible - Checking for updates...');
                      checkForUpdates();
                    }
                  });

                  log('Cache control initialized successfully');
                });

                // ============ RUN ON FOCUS ============
                window.addEventListener('focus', () => {
                  log('Window focused - Validating cache...');
                  checkForUpdates();
                });
              })();
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
