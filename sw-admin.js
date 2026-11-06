/* Menú 3D · lo que hace que el panel de administrador se pueda instalar como app.
   Siempre busca la versión más nueva en internet; si no hay conexión, muestra la última que vio. */
var CACHE = 'menu3d-admin-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(function (res) { /* no-cache: pregunta siempre si hay versión nueva */
    if (res.ok) { var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copia); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || new Response('Sin conexión', { status: 503 }); });
  }));
});
