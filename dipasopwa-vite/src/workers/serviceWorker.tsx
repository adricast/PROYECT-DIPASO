/// <reference lib="webworker" />

/****************************
 * Definición de constantes
 ****************************
 * Aquí se establece el nombre de la caché y la lista de 
 * recursos estáticos que el Service Worker almacenará 
 * al instalarse. Estos archivos son esenciales para 
 * permitir que la aplicación funcione en modo offline.
 ***************************/
const CACHE_NAME = "pos-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-144x144.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

/****************************
 * Importación de módulos externos
 ****************************
 * Se importa la lógica de sincronización desde un archivo
 * separado (syncGroupWorker). Esto mantiene el Service Worker 
 * limpio y modular, delegando las operaciones específicas 
 * a otro archivo.
 ***************************/
import * as syncWorker from './syncGroupWorker'; 

/****************************
 * Tipado de `self`
 ****************************
 * Se define el tipo de `self` como `ServiceWorkerGlobalScope` 
 * para evitar errores de linting y mejorar la autocompletación 
 * en TypeScript.
 ***************************/
const swSelf = self as unknown as ServiceWorkerGlobalScope;

/****************************
 * Instalación del Service Worker
 ****************************
 * Evento `install`: se ejecuta cuando el SW se registra 
 * por primera vez o cuando hay cambios en el archivo. 
 * Aquí se cachean los recursos definidos en `urlsToCache`.
 ***************************/
swSelf.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service Worker: Instalando y cacheando recursos...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(urlsToCache)
    )
  );
});

/****************************
 * Activación del Service Worker
 ****************************
 * Evento `activate`: se ejecuta cuando el SW toma control 
 * después de ser instalado. Se eliminan versiones antiguas 
 * de caché para liberar espacio y evitar inconsistencias.
 ***************************/
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

/****************************
 * Interceptación de peticiones (Fetch)
 ****************************
 * Evento `fetch`: intercepta todas las peticiones GET. 
 * Si el recurso existe en caché, lo devuelve desde allí; 
 * de lo contrario, lo solicita al servidor y lo cachea 
 * para futuras peticiones. Si no hay conexión, devuelve 
 * una respuesta personalizada "Offline".
 ***************************/
swSelf.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(fetchRes => {
          if (fetchRes && fetchRes.status === 200 && fetchRes.type === "basic") {
            const responseToCache = fetchRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return fetchRes;
        })
        .catch(() => {
          return new Response("Offline", { status: 408, statusText: "Offline" });
        });
    })
  );
});

/****************************
 * Comunicación con la aplicación
 ****************************
 * Evento `message`: permite que la aplicación envíe 
 * instrucciones al SW. Aquí se manejan acciones como 
 * crear, actualizar o eliminar grupos, además de 
 * sincronizar con el backend. 
 * Los resultados o errores se devuelven al hilo principal.
 ***************************/
swSelf.addEventListener("message", async (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    swSelf.skipWaiting();
    return;
  }
  
  const { action, payload } = event.data;
  
  try {
    let result;
    switch (action) {
      case 'createGroup':
        result = await syncWorker.createGroup(payload);
        break;
      case 'updateGroup':
        result = await syncWorker.updateGroup(payload);
        break;
      case 'deleteGroup':
        result = await syncWorker.deleteGroup(payload);
        break;
      case 'syncFromBackend':
        await syncWorker.syncFromBackend();
        return; 
      default:
        throw new Error('Invalid worker action');
    }
    
    const clients = await swSelf.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.postMessage({
      type: 'item-synced',
      payload: result
    }));

  } catch (error) {
    console.error(`Error en la acción del Service Worker '${action}':`, error);
    const clients = await swSelf.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.postMessage({
      type: 'item-failed',
      payload: { error }
    }));
  }
});
