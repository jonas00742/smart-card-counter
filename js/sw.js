const CACHE_NAME = 'smart-counter-v26';

const ASSETS_TO_CACHE = [
    '../',
    '../index.html',
    '../css/style.css',
    './config.js',
    './model.js',
    './view.js',
    './controller.js',
    './app.js',
    '../manifest.json',
    '../assets/icon-192.png',
    '../assets/icon-512.png'
];

// 1. INSTALL
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting())
    );
});

// 2. ACTIVATE
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
        .then(() => self.clients.claim())
    );
});

// 3. FETCH
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});