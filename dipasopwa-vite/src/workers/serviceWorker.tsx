/// <reference lib="webworker" />

// Nombre de la caché para esta versión del Service Worker.
// Cambiar el nombre crea una nueva caché, lo que ayuda a invalidar la caché antigua.
const CACHE_NAME = "pos-app-cache-v1";
// Lista de URLs de recursos estáticos que se pre-cachean durante la instalación.
// Esto permite que la aplicación funcione sin conexión.
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-144x144.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// 🔹 Tipar self para evitar errores de linting
// 'self' es una variable global en el contexto del Service Worker.
const swSelf = self as unknown as ServiceWorkerGlobalScope;

// --- 1. Instalación ---
// El evento 'install' se dispara cuando el Service Worker se registra por primera vez.
swSelf.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service Worker: Instalando y cacheando recursos...");
  // waitUntil asegura que la instalación no se complete hasta que la promesa se resuelva.
  event.waitUntil(
    // Abrimos un objeto de caché con el nombre definido.
    caches.open(CACHE_NAME).then(cache => 
      // Agregamos todas las URLs de la lista a la caché.
      cache.addAll(urlsToCache)
    )
  );
});

// --- 2. Activación ---
// El evento 'activate' se dispara cuando el Service Worker se activa y toma el control de la página.
swSelf.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Service Worker: Activado");
  event.waitUntil(
    // Obtenemos todos los nombres de las cachés existentes.
    caches.keys().then(cacheNames =>
      // Esperamos a que todas las promesas se resuelvan.
      Promise.all(
        // Mapeamos cada nombre de caché para eliminar las que no coinciden con la actual.
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
// El evento 'fetch' se dispara cada vez que la página intenta cargar un recurso.
swSelf.addEventListener("fetch", (event: FetchEvent) => {
  // Ignoramos las peticiones que no son GET, como POST o PUT, que no deben ser cacheables.
  if (event.request.method !== "GET") return;

  // Respondemos a la petición con una promesa.
  event.respondWith(
    // Intentamos encontrar la petición en la caché.
    caches.match(event.request).then(response => {
      // Si el recurso está en la caché, lo devolvemos inmediatamente.
      // Si no, realizamos una petición de red.
      return response || fetch(event.request)
        .then(fetchRes => {
          // Si la respuesta es válida (status 200, tipo 'basic'), la guardamos en la caché.
          if (fetchRes && fetchRes.status === 200 && fetchRes.type === "basic") {
            const responseToCache = fetchRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return fetchRes;
        })
        .catch(() => {
          // Si la petición de red falla (ej. sin conexión), devolvemos una respuesta de fallback.
          return new Response("Offline", { status: 408, statusText: "Offline" });
        });
    })
  );
});

// --- 4. Mensajes desde la app ---
// Escucha mensajes enviados desde el código JavaScript de la aplicación principal.
swSelf.addEventListener("message", (event: ExtendableMessageEvent) => {
  // Si la aplicación pide saltar la espera, el Service Worker lo hace.
  // Esto permite que el nuevo Service Worker tome el control más rápido.
  if (event.data?.type === "SKIP_WAITING") {
    swSelf.skipWaiting();
  }
});