const CACHE_NAME = 'tracker-store-v3';

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([
            '/',
            '/index.html',
            '/manifest.json'
        ]))
    );
    self.skipWaiting(); // Forces the new service worker to activate immediately
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take over the page immediately
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        // 1. Try to fetch the newest version from the network (Netlify)
        fetch(e.request)
            .then((response) => {
                // 2. If successful, save a copy of the new version to the cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return response;
            })
            // 3. If the network fails (you are offline), fallback to the cached version
            .catch(() => caches.match(e.request))
    );
});