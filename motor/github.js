/* Menú 3D · leer y publicar los archivos del repositorio.
   - Leer (menú publicado, historial de versiones, archivos de un local): directo de GitHub, sin token (el repo es público).
   - Publicar: a través de la función "panel" de Supabase, con la sesión del usuario (sesion.js).
     El token de GitHub queda guardado en Supabase y nunca llega al navegador.
   Todos los archivos de una publicación van en un solo commit; GitHub Pages los pone online en 1-2 minutos. */
window.GitHub = (function () {
  'use strict';
  var REPO = 'ronkstudio/menu-3d-publico', RAMA = 'main';
  var API = 'https://api.github.com/repos/' + REPO;
  /* antes el administrador guardaba un token de GitHub en el navegador: ya no hace falta y se borra */
  try { localStorage.removeItem('menu3d-github-token'); } catch (e) {}

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    return fetch(API + ruta, { headers: { 'Accept': opciones.accept || 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404 && opciones.permitir404) return null;
        if (r.status === 403 || r.status === 429) throw new Error('GitHub está limitando las consultas desde esta conexión. Esperá unos minutos y probá de nuevo.');
        if (!r.ok) return r.text().then(function (t) { throw new Error('GitHub ' + r.status + ': ' + t.slice(0, 200)); });
        return opciones.accept === 'application/vnd.github.raw' ? r.text() : r.json();
      });
  }

  /* lee un archivo de texto del repo (null si no existe); "version" es un commit anterior (opcional) */
  function leer(ruta, version) { return pedir('/contents/' + ruta + '?ref=' + (version || RAMA), { accept: 'application/vnd.github.raw', permitir404: true }); }

  /* versiones publicadas de un archivo, de la más nueva a la más vieja: [{ version, fecha, mensaje }] */
  function historial(ruta) {
    return pedir('/commits?path=' + encodeURIComponent(ruta) + '&sha=' + RAMA + '&per_page=30').then(function (l) {
      return l.map(function (c) { return { version: c.sha, fecha: c.commit.author.date, mensaje: c.commit.message.split('\n')[0] }; });
    });
  }

  /* lista los archivos del repo que están dentro de una carpeta */
  function listar(carpeta) {
    return pedir('/git/trees/' + RAMA + '?recursive=1').then(function (t) {
      return t.tree.filter(function (x) { return x.type === 'blob' && x.path.indexOf(carpeta + '/') === 0; }).map(function (x) { return x.path; });
    });
  }

  /* archivos: [{ ruta, texto }], [{ ruta, dataUrl }] o [{ ruta, borrar: true }]; carpeta = el local que se publica */
  function publicar(archivos, mensaje, aviso, carpeta) {
    (aviso || function () {})('Publicando…');
    return Sesion.funcion('publicar', { carpeta: carpeta, archivos: archivos, mensaje: mensaje });
  }

  return { REPO: REPO, leer: leer, historial: historial, listar: listar, publicar: publicar };
})();
