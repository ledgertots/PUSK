// Bump this version string on every deploy that should force-refresh clients.
const CACHE_NAME = 'pusk-v3';

self.addEventListener('install', (event) => {
  // Don't pre-cache anything eagerly — always try the network first.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy: always try to get the latest version from the network.
// Only fall back to the cache if the network is unavailable (offline).
// This guarantees users always see the newest deploy while online.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, copy); } catch (e) {}
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
