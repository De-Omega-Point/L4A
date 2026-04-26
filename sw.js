const CACHE_NAME = 'loyalty-4-all-v18';
const OLD_PREFIXES = ['loyalty-4-all-v', 'loyalty-4-all-pwa-', 'loyalty-4-all-clean-'];
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './vendor/qrcode-generator.js',
    './vendor/jsQR.min.js',
    '../assets/logo.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => Promise.all(APP_SHELL.map(asset => cache.add(asset).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key !== CACHE_NAME && OLD_PREFIXES.some(prefix => key.startsWith(prefix)))
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { cache: 'reload' })
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                }))
    );
});
