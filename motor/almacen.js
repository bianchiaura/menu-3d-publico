/* Menú 3D · lugar donde el panel guarda los borradores en este navegador.
   Usa IndexedDB, que admite cientos de MB (fotos y modelos 3D incluidos), en vez de localStorage (unos 5 MB).
   Si IndexedDB no está disponible, usa localStorage. Los borradores viejos de localStorage se pasan solos.
   Almacen.leer(clave) / guardar(clave, texto) / borrar(clave) devuelven promesas. */
window.Almacen = (function () {
  'use strict';
  var base = null;
  function abrir() {
    if (!base) base = new Promise(function (ok, mal) {
      if (!window.indexedDB) { mal(new Error('sin IndexedDB')); return; }
      var r = indexedDB.open('menu3d', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('borradores'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { mal(r.error); };
    });
    return base;
  }
  function pedido(modo, accion) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction('borradores', modo), r = accion(t.objectStore('borradores'));
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = t.onabort = function () { mal(t.error); };
      });
    });
  }
  function ls(f) { try { return f(); } catch (e) { return null; } }

  function leer(clave) {
    return pedido('readonly', function (s) { return s.get(clave); }).then(function (v) {
      if (v != null) return v;
      var viejo = ls(function () { return localStorage.getItem(clave); }); /* borrador de antes: se muda */
      if (viejo == null) return null;
      return guardar(clave, viejo).then(function () { ls(function () { localStorage.removeItem(clave); }); return viejo; });
    }, function () { return ls(function () { return localStorage.getItem(clave); }); });
  }
  function guardar(clave, texto) {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); /* que el navegador no lo borre solo */
    return pedido('readwrite', function (s) { return s.put(texto, clave); })
      .catch(function () { localStorage.setItem(clave, texto); });
  }
  function borrar(clave) {
    ls(function () { localStorage.removeItem(clave); });
    return pedido('readwrite', function (s) { return s.delete(clave); }).catch(function () {});
  }
  return { leer: leer, guardar: guardar, borrar: borrar };
})();
