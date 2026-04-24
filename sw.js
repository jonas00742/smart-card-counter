const CACHE_NAME = 'smart-counter-v33';

const ASSETS_TO_CACHE = [
    // App Shell
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',

    // Styles
    './css/style.css',

    // Scripts
    './js/app.js',
    './js/config.js',
    './js/model.js',
    './js/view.js',
    './js/components/FeedbackModals.js',
    './js/components/GameTableView.js',
    './js/components/InputModal.js',
    './js/components/SetupView.js',
    './js/controllers/AppController.js',
    './js/controllers/RoundController.js',
    './js/controllers/SetupController.js',
    './js/core/AutoFillService.js',
    './js/core/EventBus.js',
    './js/core/events.js',
    './js/core/ScoreEngine.js',
    './js/utils/dom.js',

    // Assets
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/Danger Alarm.mp3',
    './assets/Fah.mp3'
];

// 1. INSTALL
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(async cache => {
            for (const asset of ASSETS_TO_CACHE) {
                try {
                    await cache.add(asset);
                } catch (error) {
                    console.error(`Failed to cache asset: ${asset}`, error);
                }
            }
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