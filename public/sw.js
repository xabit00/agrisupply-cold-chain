// AgriSupply Cold-Chain Service Worker
// Caches app shell + GET responses. Offline writes are handled
// by the in-app queue (offline/queue.service.ts), not here.

const CACHE_NAME = 'agrisupply-v1';
const APP_SHELL = [
  '/',
  '/login',
  '/manifest.json',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Navigations (HTML pages): network-first, fall back to cache
// - Static assets (JS/CSS/img): cache-first
// - API calls (GET): network-first, fall back to cache
// - POST/PUT/PATCH/DELETE: never intercepted — the in-app queue handles these
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never intercept non-GET mutations — the app queue owns those
  if (request.method !== 'GET') return;

  // Skip API calls that are unlikely to be useful offline
  const isApi = url.pathname.startsWith('/api/');
  const isNavigation = request.mode === 'navigate';
  const isAsset =
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);

  if (isNavigation) {
    // HTML page: network-first, offline falls back to cached shell
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/') // fallback to home
          )
        )
    );
    return;
  }

  if (isAsset) {
    // JS/CSS/images: cache-first
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  if (isApi) {
    // GET API: network-first, fall back to cache if offline
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
