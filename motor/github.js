/* Menú 3D · publicar en GitHub desde el navegador del administrador.
   Usa un token personal de GitHub (con permiso solo sobre este repositorio) guardado en este navegador.
   Todos los archivos de una publicación van en un solo commit; GitHub Pages los pone online en 1-2 minutos. */
window.GitHub = (function () {
  'use strict';
  var REPO = 'bianchiaura/menu-3d-publico', RAMA = 'main', CLAVE = 'menu3d-github-token';
  var API = 'https://api.github.com/repos/' + REPO;

  function token() { try { return localStorage.getItem(CLAVE) || ''; } catch (e) { return ''; } }
  function guardarToken(t) { try { if (t) localStorage.setItem(CLAVE, t); else localStorage.removeItem(CLAVE); } catch (e) {} }

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var h = { 'Authorization': 'Bearer ' + token(), 'Accept': opciones.accept || 'application/vnd.github+json' };
    if (opciones.body) h['Content-Type'] = 'application/json';
    return fetch(API + ruta, { method: opciones.method || 'GET', headers: h, body: opciones.body ? JSON.stringify(opciones.body) : undefined })
      .then(function (r) {
        if (r.status === 404 && opciones.permitir404) return null;
        if (!r.ok) return r.text().then(function (t) { throw new Error('GitHub ' + r.status + ': ' + t.slice(0, 200)); });
        return opciones.accept === 'application/vnd.github.raw' ? r.text() : r.json();
      });
  }

  /* comprueba que el token sirve para escribir en el repo */
  function probar() {
    return pedir('').then(function (r) {
      if (!r.permissions || !r.permissions.push) throw new Error('El token no tiene permiso para escribir en ' + REPO);
      return true;
    });
  }

  /* lee un archivo de texto del repo (null si no existe) */
  function leer(ruta) { return pedir('/contents/' + ruta + '?ref=' + RAMA, { accept: 'application/vnd.github.raw', permitir404: true }); }

  function base64Texto(s) {
    var b = new TextEncoder().encode(s), t = '';
    for (var i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(t);
  }

  /* archivos: [{ ruta, texto }] o [{ ruta, dataUrl }] */
  function publicar(archivos, mensaje, aviso) {
    aviso = aviso || function () {};
    var padre;
    return pedir('/git/ref/heads/' + RAMA).then(function (ref) {
      padre = ref.object.sha;
      return pedir('/git/commits/' + padre);
    }).then(function (commit) {
      var hechos = 0;
      return Promise.all(archivos.map(function (a) {
        var contenido = a.dataUrl ? a.dataUrl.split(',')[1] : base64Texto(a.texto);
        return pedir('/git/blobs', { method: 'POST', body: { content: contenido, encoding: 'base64' } }).then(function (b) {
          aviso('Subiendo archivos… ' + (++hechos) + ' de ' + archivos.length);
          return { path: a.ruta, mode: '100644', type: 'blob', sha: b.sha };
        });
      })).then(function (arbol) {
        return pedir('/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: arbol } });
      });
    }).then(function (arbol) {
      return pedir('/git/commits', { method: 'POST', body: { message: mensaje, tree: arbol.sha, parents: [padre] } });
    }).then(function (nuevo) {
      return pedir('/git/refs/heads/' + RAMA, { method: 'PATCH', body: { sha: nuevo.sha } });
    });
  }

  return { REPO: REPO, token: token, guardarToken: guardarToken, probar: probar, leer: leer, publicar: publicar };
})();
