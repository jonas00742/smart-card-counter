// Versionsnummer des Caches. WICHTIG: Wenn du später Code änderst (z.B. in der app.js),
// musst du hier 'v2', 'v3' etc. eintragen, damit das Handy die neuen Dateien lädt!
const CACHE_NAME = 'smart-counter-v4';

// Alle Dateien, die für den Offline-Modus benötigt werden
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/config.js',
    './js/model.js',
    './js/view.js',
    './js/controller.js',
    './js/app.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// 1. INSTALL-PHASE: Ressourcen in den Cache laden
self.addEventListener('install', event => {
    console.log('[Service Worker] Installiert...');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting()) // Zwingt den SW, sofort aktiv zu werden
    );
});

// 2. ACTIVATE-PHASE: Alte Caches aufräumen
self.addEventListener('activate', event => {
    console.log('[Service Worker] Aktiviert...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Lösche alle Caches, die nicht dem aktuellen CACHE_NAME entsprechen
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Lösche alten Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // Übernimmt sofort die Kontrolle über alle offenen Tabs
    );
});

// 3. FETCH-PHASE: Netzwerkanfragen abfangen (Cache First Strategy)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            // Wenn die Datei im Cache gefunden wurde, gib sie zurück
            if (cachedResponse) {
                return cachedResponse;
            }
            // Ansonsten lade sie ganz normal aus dem Internet
            return fetch(event.request);
        })
    );
});