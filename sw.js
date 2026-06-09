const CACHE_NAME = 'hisa-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/database.js',
    '/js/app.js',
    '/manifest.json',
    '/icons/LogoHisa01.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});