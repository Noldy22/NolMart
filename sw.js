// sw.js - NolMart PWA Service Worker
const CACHE_NAME = 'nolmart-pwa-v1';

self.addEventListener('install', (event) => {
    // Activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Network-first fetch handler required for Chrome PWA installability criteria
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Completely bypass Service Worker for admin CMS, API endpoints, and non-GET requests
    if (
        event.request.method !== 'GET' ||
        !url.protocol.startsWith('http') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/api')
    ) {
        return;
    }

    // Network-first: always fetch fresh from network, fall back to cache if offline
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
