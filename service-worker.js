// service-worker.js
// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.

const CACHE_NAME = 'tgd-cache-v1';
const OFFLINE_PAGE = '/offline.html';

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/listings.html',
  '/map.html',
  '/starred.html',
  '/settings.html',
  '/offline.html',
  '/css/index.css',
  '/css/listings.css',
  '/css/admin.css',
  '/css/business.css',
  '/css/pwa.css',
  '/js/index.js',
  '/js/listings.js',
  '/js/partials-loader.js',
  '/js/pwa/app.js',
  '/js/pwa/dock.js',
  '/js/pwa/settings.js',
  '/js/pwa/starred.js',
  '/js/pwa/storage.js',
  'https://static.thegreekdirectory.org/img/logo/blue.svg',
  'https://static.thegreekdirectory.org/img/logo/white.svg',
  'https://static.thegreekdirectory.org/img/logo/bluefavicon.png',
  'https://static.thegreekdirectory.org/img/logo/whitefavicon.png'
];

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_IMAGE') {
    const imageUrl = event.data.url;
    caches.open(CACHE_NAME).then((cache) => {
      fetch(imageUrl).then((response) => {
        cache.put(imageUrl, response);
      });
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Copyright (C) The Greek Directory, 2025-present. All rights reserved. This source code is proprietary and no part may not be used, reproduced, or distributed without written permission from The Greek Directory. For more information, visit https://thegreekdirectory.org/legal.
