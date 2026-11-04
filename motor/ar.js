/* Menú 3D · AR "de verdad": el sistema de realidad aumentada del propio celular detecta la mesa
   y deja el plato fijo y en tamaño real, aunque uno se mueva alrededor.
   - iPhone/iPad: AR Quick Look.  - Android: WebXR (Google Play Services para AR).
   El modelo se convierte en el momento a .glb (formato estándar 3D) desde lo que armó el generador,
   y lo abre <model-viewer> (librería gratuita de Google). Nada se sube a ningún lado.
   Necesita cargar-three.js y relieve.js. */
window.Menu3DAR = (function () {
  'use strict';
  var EXPORTADOR = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/exporters/GLTFExporter.js/+esm';
  var VISOR = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  var hay = null;

  /* ¿este celular tiene AR? (sin bajar nada pesado) */
  function soportado() {
    if (hay) return hay;
    var ios = document.createElement('a').relList;
    if (ios && ios.supports && ios.supports('ar')) { hay = Promise.resolve(true); return hay; } /* iPhone/iPad con Safari */
    hay = navigator.xr && navigator.xr.isSessionSupported ? navigator.xr.isSessionSupported('immersive-ar').catch(function () { return false; }) : Promise.resolve(false);
    return hay;
  }

  /* arma el .glb del plato en tamaño real (diámetro del plato en cm; 26 cm si no se indica) */
  function glb(modelo, base) {
    return Promise.all([window.cargarThree(), import(EXPORTADOR)]).then(function (r) {
      var THREE = r[0], GLTFExporter = r[1].GLTFExporter;
      return window.Menu3DRelieve(THREE, modelo, base).then(function (g) {
        /* para AR se usa un material simple: el sistema del celular pone su propia luz */
        g.traverse(function (o) {
          if (!o.isMesh) return;
          var m = o.material;
          if (m.map) { m.map.userData.mimeType = 'image/jpeg'; o.material = new THREE.MeshStandardMaterial({ map: m.map, roughness: 1, metalness: 0 }); }
        });
        g.scale.setScalar((modelo.diametro || 26) / 200); /* el modelo mide 1 de radio → metros */
        var escena = new THREE.Scene(); escena.add(g);
        return new Promise(function (ok, mal) {
          new GLTFExporter().parse(escena, function (bin) { ok(URL.createObjectURL(new Blob([bin], { type: 'model/gltf-binary' }))); }, mal, { binary: true });
        });
      });
    });
  }

  /* El celular solo deja abrir el AR en el momento exacto de un toque, y preparar el plato tarda unos segundos.
     Por eso: preparar() se llama apenas se abre la vista 3D (en segundo plano) y lanzar() al tocar "Ver en AR". */
  var visor = null, listo = false;
  function preparar(plato, base) {
    listo = false;
    return Promise.all([glb(plato.modelo, base), customElements.get('model-viewer') ? null : import(VISOR)]).then(function (r) {
      descartar();
      visor = document.createElement('model-viewer');
      visor.setAttribute('src', r[0]);
      visor.setAttribute('alt', plato.nombre || 'Plato en 3D');
      visor.setAttribute('ar', '');
      visor.setAttribute('ar-modes', 'webxr quick-look scene-viewer');
      visor.setAttribute('ar-scale', 'fixed'); /* tamaño real, sin agrandar */
      visor.setAttribute('ar-placement', 'floor');
      visor.style.cssText = 'position:fixed;width:2px;height:2px;left:-10px;top:-10px;opacity:0;pointer-events:none';
      document.body.appendChild(visor);
      return new Promise(function (ok, mal) {
        visor.addEventListener('load', function () {
          if (!visor.canActivateAR) { mal(new Error('sin-ar')); return; }
          listo = true; ok();
        }, { once: true });
        visor.addEventListener('error', function () { mal(new Error('No se pudo preparar el plato')); }, { once: true });
      });
    });
  }
  function lanzar() { if (visor && listo) { visor.activateAR(); return true; } return false; }
  function descartar() {
    if (visor) { URL.revokeObjectURL(visor.getAttribute('src')); visor.remove(); }
    visor = null; listo = false;
  }

  return { soportado: soportado, preparar: preparar, lanzar: lanzar, descartar: descartar, glb: glb };
})();
