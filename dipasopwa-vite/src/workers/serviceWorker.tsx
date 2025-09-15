/// <reference lib="webworker" />

const CACHE_NAME = "pos-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-144x144.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// 🔹 Tipar self para evitar ESLint

const swSelf = self as unknown as ServiceWorkerGlobalScope;

// --- 1. Instalación ---
swSelf.addEventListener("install", (event: ExtendableEvent)  => {
  console.log("Service Worker: Instalando y cacheando recursos...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// --- 2. Activación ---
swSelf.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Service Worker: Activado");
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Service Worker: Eliminando caché antigua", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// --- 3. Fetch ---
swSelf.addEventListener("fetch", (event: FetchEvent) => {
  // Solo cache-first para GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(fetchRes => {
          // Guardar en cache la respuesta de GET válida
          if (fetchRes && fetchRes.status === 200 && fetchRes.type === "basic") {
            const responseToCache = fetchRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return fetchRes;
        })
        .catch(() => {
          // Fallback offline
          return new Response("Offline", { status: 408, statusText: "Offline" });
        });
    })
  );
});

// --- 4. Mensajes desde la app ---
swSelf.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    swSelf.skipWaiting();
  }
});
