
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

// Instalación: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejas
self.addEventListener("activate", (event) => {
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

// Fetch: cache first
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
