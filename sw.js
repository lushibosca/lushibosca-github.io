const CACHE_NAME = 'horarios-v5.77-cache';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Error al cachear:', err))
  );
  self.skipWaiting(); // Activa inmediatamente el nuevo SW
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Toma control inmediato
});

// Fetch con validación de origen y manejo de errores
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Solo intercepta peticiones del mismo origen
  if (url.origin !== location.origin) {
    return; // Deja pasar peticiones externas sin interceptar
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Devuelve del cache
        }
        
        // Intenta obtener de la red
        return fetch(event.request)
          .then(networkResponse => {
            // Opcionalmente cachea nuevas respuestas
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(err => {
            console.error('Fetch falló:', err);
            // Opcionalmente devuelve una página offline
            return caches.match('./index.html');
          });
      })
  );
});
