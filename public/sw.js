const CACHE_VERSION = 'mna8dtb1';
const CACHE_NAME = `sidra-tv-v${CACHE_VERSION}`;
const PRECACHE_URLS = ['/manifest.json', '/sidra-logo.webp'];

const isSameOrigin = (requestUrl) => {
  return new URL(requestUrl).origin === self.location.origin;
};

const isStaticAssetRequest = (request) => {
  if (!isSameOrigin(request.url)) return false;

  const { pathname } = new URL(request.url);

  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf')
  );
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches — fresh start on every deploy
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Purging old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!isStaticAssetRequest(event.request)) return;

  const { pathname } = new URL(event.request.url);

  // Images: network-first so updates propagate immediately
  const isImage = /\.(png|jpg|jpeg|svg|webp|gif|ico)$/.test(pathname);

  if (isImage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other static assets (JS, CSS, fonts): cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || !response.ok) return response;

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => cached);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Show notification via Service Worker (works on mobile/Android PWA)
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      tag: 'sidra-notification',
      requireInteraction: false,
      ...options,
    });
  }
});

// Handle notification click — open the app or a specific link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (link !== '/') client.navigate(link);
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});

