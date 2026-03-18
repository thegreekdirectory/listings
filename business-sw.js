const BUSINESS_CACHE = 'tgd-business-v2';
const BUSINESS_ASSETS = [
  '/business',
  '/business.html',
  '/src/output.css',
  '/css/business.css',
  '/js/business-auth.js',
  '/js/business-dashboard.js',
  '/js/rich-text-editor.js',
  '/js/supabase-config.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(BUSINESS_CACHE).then((cache) => cache.addAll(BUSINESS_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== BUSINESS_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
