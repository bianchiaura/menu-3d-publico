/* Menú 3D · carga three.js una sola vez (jsdelivr y, si falla, unpkg). Lo usan el visor, el generador y el AR.
   Se usa la versión "+esm" de jsdelivr porque es la misma que usa el exportador de ar.js (así comparten la librería). */
(function () {
  var URL1 = 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
  var URL2 = 'https://unpkg.com/three@0.160.0/build/three.module.js';
  var p = null;
  window.cargarThree = function () {
    if (!p) p = import(URL1).catch(function () { return import(URL2); }).catch(function (e) { p = null; throw e; });
    return p;
  };
})();
