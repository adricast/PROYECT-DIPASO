/* eslint-disable no-restricted-globals */
// Service Worker básico para precache de la PWA
const CACHE_NAME = "pos-app-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-144x144.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/assets/index-DYzZ9BMf.js",
  "/assets/index-DjqV5JYk.css",
];

declare const self: ServiceWorkerGlobalScope;

// Instalación: precache
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activación: eliminar caches viejas
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: intentar servir desde cache primero
self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
