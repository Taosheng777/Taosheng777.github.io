const CACHE_NAME = 'personal-toolbox-v1.7.1';
const CACHE_PREFIX = 'personal-toolbox-';
const APP_SHELL = [
  '/',
  '/404.html',
  '/about/',
  '/tools/',
  '/ai/',
  '/ai/prompts/',
  '/growth/',
  '/growth/who-curve/',
  '/growth/curve-4-18/',
  '/growth/curve-4-18/dataset.js',
  '/mind/',
  '/mind/phq-9/',
  '/mind/gad-7/',
  '/mind/phq-2/',
  '/mind/gad-2/',
  '/mind/asq/',
  '/mind/sas/',
  '/mind/sds/',
  '/mind/snap-iv/',
  '/mind/psc-17/',
  '/mind/conners-psq/',
  '/mind/conners-t/',
  '/life/',
  '/life/darkest-dungeon/',
  '/privacy/',
  '/version/',
  '/licenses/',
  '/licenses/GPL-3.0.txt',
  '/assets/site.css',
  '/assets/banner.jpg',
  '/assets/avatar.jpg',
  '/assets/tool-shell.css',
  '/assets/mental-health.css',
  '/assets/mental-health.js',
  '/assets/conners-norms.js',
  '/assets/pwa.js',
  '/manifest.webmanifest',
  '/og.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('/404.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
