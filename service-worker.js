const CACHE_NAME = 'personal-toolbox-v1.13.4';
const CACHE_PREFIX = 'personal-toolbox-';
const APP_SHELL = [
  '/',
  '/404.html',
  '/about/',
  '/tools/',
  '/ai/',
  '/ai/prompts/',
  '/ai/skills/',
  '/ai/video-workbench/',
  '/ai/video-workbench/board.css',
  '/ai/video-workbench/board.js',
  '/ai/video-workbench/catalog.js',
  '/ai/video-workbench/sources.html',
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
  '/mind/personality/',
  '/life/',
  '/life/darkest-dungeon/',
  '/privacy/',
  '/version/',
  '/licenses/',
  '/licenses/GPL-3.0.txt',
  '/licenses/ayghri-i-have-adhd-MIT.txt',
  '/assets/site.css',
  '/assets/skills/laoyeye-guide.jpg',
  '/assets/skills/research-workflow.jpg',
  '/assets/skills/human-writing.jpg',
  '/assets/portrait.jpg',
  '/assets/miniprogram-code.jpg',
  '/assets/tool-shell.css',
  '/assets/mental-health.css',
  '/assets/mental-health.js',
  '/assets/conners-norms.js',
  '/assets/personality.css',
  '/assets/personality.js',
  '/assets/pwa.js',
  '/assets/thinking-methods.js',
  '/assets/prompt-library.css',
  '/licenses/mattpocock-skills-MIT.txt',
  '/licenses/khazix-skills-MIT.txt',
  '/licenses/partner-skill-MIT.txt',
  '/manifest.webmanifest',
  '/og.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/growth/curve/',
  '/growth/target-height/',
  '/respiratory/',
  '/respiratory/act/',
  '/respiratory/cact/',
  '/mind/dsrsc/',
  '/mind/scared/',
  '/mind/pas/',
  '/mind/sdq23/',
  '/mind/sdq417/',
  '/assets/mini/age.js',
  '/assets/mini/bmi-overweight-data.js',
  '/assets/mini/bmi-thinness-data.js',
  '/assets/mini/bone-age.js',
  '/assets/mini/child-scale-data.js',
  '/assets/mini/child-scales.js',
  '/assets/mini/conners-norms.js',
  '/assets/mini/growth-4-18-data.js',
  '/assets/mini/growth-4-18.js',
  '/assets/mini/growth-chart.js',
  '/assets/mini/growth-interpretation.js',
  '/assets/mini/personality-data.js',
  '/assets/mini/personality-report.js',
  '/assets/mini/personality.js',
  '/assets/mini/respiratory-data.js',
  '/assets/mini/scale-data.js',
  '/assets/mini/scales.js',
  '/assets/mini/target-height.js',
  '/assets/mini/who-reference.js',
  '/assets/mini/who.js',
  '/assets/clinical-tools.css',
  '/assets/mini-tools.js',
  '/assets/growth-assessment.js',
  '/assets/growth-ui.js',
  '/assets/target-height-ui.js',
  '/assets/extra-scales-ui.js',
  '/assets/mind-filter.js'
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
  // 视频按需播放，不预缓存、不写入工具站的离线缓存；Range 也直接交给网络。
  if (url.pathname.startsWith('/ai/video-workbench/media/') || request.headers.has('range')) return;

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
