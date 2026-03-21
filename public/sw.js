// Enhanced cache versioning with timestamp
const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `sidra-tv-v${CACHE_VERSION}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/sidra-logo.png',
  '/manifest.json',
];

// Install event - immediately become active
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Ignore errors if files not available during initial install
        console.log('[Service Worker] Some files not available for caching');
      });
    })
  );
  
  // Force service worker to become active immediately
  self.skipWaiting();
});

// Activate event - take control of all clients and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating:', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith('sidra-tv-v')) {
              return caches.delete(cacheName);
            }
            // Delete old versioned caches
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
  
  // Notify all clients to reload
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SKIP_WAITING',
        message: 'New version available, reloading...'
      });
    });
  });
});

// Fetch event - network first for dynamic content, cache first for static assets
self.addEventListener('fetch', (event) => {
  // Skip POST, PUT, DELETE, PATCH requests and API calls
  if (event.request.method !== 'GET') {
    return;
  }

  const { pathname } = new URL(event.request.url);
  
  // Network first for API calls
  if (pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Navigation requests (HTML pages) — ALWAYS network first so users see latest deploy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets (images, fonts, css, js) — cache first for performance
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => undefined);
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
