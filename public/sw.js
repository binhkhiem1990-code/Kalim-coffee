const CACHE_NAME = 'kalim-pos-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static skeleton assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Optional skeleton pre-cache omitted: ', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache: ', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Only handle GET requests and skip browser extensions or API routes to keep things clean
  if (req.method !== 'GET') return;
  
  const url = new URL(req.url);
  
  // Skip handling backend API requests directly or websocket HMR
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/socket.io') || url.hostname.includes('localhost') && url.port === '5173') {
    return;
  }

  // Network-First, falling back to cache strategy
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Cache valid responses for reuse
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: Fallback to cache
        console.log('[Service Worker] Network fail, serving from cache: ', req.url);
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request failed, return index.html fallback
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});
