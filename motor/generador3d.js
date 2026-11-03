/* Menú 3D · generador de modelos 3D a partir de fotos reales del plato.
   Corre entero en el navegador, sin servidor y sin costo:
   1. Se encuadra el plato en la foto con una elipse (si la foto está sacada en ángulo, la elipse la "endereza").
   2. Una IA de profundidad (Depth Anything V2, vía transformers.js) estima qué tan cerca está cada punto.
   3. Se le resta el plano del plato y queda la altura de la comida: eso es el relieve.
   El resultado se guarda como { tipo: "foto", textura, relieve, altura } y lo dibuja relieve.js.
   Necesita cargar-three.js y relieve.js. */
(function () {
  'use strict';
  var TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
  var MODELO = 'onnx-community/depth-anything-v2-small';
  var LADO = 518, GRILLA = 128, estimador = null;

  function preparar(aviso) {
    if (!estimador) estimador = import(TRANSFORMERS).then(function (T) {
      var bajado = {};
      return T.pipeline('depth-estimation', MODELO, {
        progress_callback: function (p) {
          if (p.status === 'progress' && p.total) {
            bajado[p.file] = [p.loaded, p.total];
            var l = 0, t = 0; Object.keys(bajado).forEach(function (k) { l += bajado[k][0]; t += bajado[k][1]; });
            aviso('Bajando el generador (solo la primera vez): ' + Math.round(l / t * 100) + '%');
          }
        }
      });
    }).catch(function (e) { estimador = null; throw e; });
    return estimador;
  }

  /* recorta la elipse elegida y la estira a un cuadrado: así un plato fotografiado en ángulo queda redondo */
  function recorte(img, e, lado, calidad) {
    var c = document.createElement('canvas'); c.width = c.height = lado;
    c.getContext('2d').drawImage(img, e.cx - e.rx, e.cy - e.ry, e.rx * 2, e.ry * 2, 0, 0, lado, lado);
    return calidad ? c.toDataURL('image/jpeg', calidad) : c;
  }

  function generar(img, e, aviso) {
    aviso = aviso || function () {};
    return preparar(aviso).then(function (est) {
      aviso('Analizando la foto…');
      return est(recorte(img, e, LADO).toDataURL('image/jpeg', .92));
    }).then(function (out) {
      var D = out.depth, N = GRILLA, d = new Float32Array(N * N), dentro = new Uint8Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var u = (x + .5) / N, v = (y + .5) / N, dx = u * 2 - 1, dy = v * 2 - 1;
        d[y * N + x] = D.data[(Math.floor(v * D.height) * D.width + Math.floor(u * D.width)) * D.channels] / 255;
        dentro[y * N + x] = dx * dx + dy * dy <= 1 ? 1 : 0;
      }
      /* plano del plato: se ajusta con los puntos cerca del borde (mínimos cuadrados) */
      var S = [0, 0, 0, 0, 0, 0, 0, 0, 0], B = [0, 0, 0];
      for (var i = 0; i < N * N; i++) {
        var px = (i % N + .5) / N * 2 - 1, py = (Math.floor(i / N) + .5) / N * 2 - 1, r = Math.sqrt(px * px + py * py);
        if (r < .8 || r > .95) continue;
        var f = [px, py, 1];
        for (var a = 0; a < 3; a++) { B[a] += f[a] * d[i]; for (var b = 0; b < 3; b++) S[a * 3 + b] += f[a] * f[b]; }
      }
      var p = resolver(S, B), h = new Float32Array(N * N), lista = [];
      for (var k = 0; k < N * N; k++) {
        var qx = (k % N + .5) / N * 2 - 1, qy = (Math.floor(k / N) + .5) / N * 2 - 1;
        h[k] = dentro[k] ? Math.max(0, d[k] - (p[0] * qx + p[1] * qy + p[2])) : 0;
        if (dentro[k]) lista.push(h[k]);
      }
      /* se suaviza un poco y se normaliza con el percentil 99 (para que un punto suelto no aplaste todo) */
      h = suavizar(suavizar(h, N), N);
      lista.sort(function (m, n) { return m - n; });
      var tope = Math.max(.02, lista[Math.floor(lista.length * .99)] || .02);
      var c = document.createElement('canvas'); c.width = c.height = N;
      var g = c.getContext('2d'), im = g.createImageData(N, N);
      for (var q = 0; q < N * N; q++) {
        var val = Math.round(Math.min(1, h[q] / tope) * 255);
        im.data[q * 4] = im.data[q * 4 + 1] = im.data[q * 4 + 2] = val; im.data[q * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      return { tipo: 'foto', textura: recorte(img, e, 768, .85), relieve: c.toDataURL('image/png'), altura: .3 };
    });
  }
  function resolver(S, B) { /* sistema 3x3 por Cramer */
    function det(m) { return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]); }
    var D = det(S); if (Math.abs(D) < 1e-9) return [0, 0, 0];
    return [0, 1, 2].map(function (c) { var m = S.slice(); for (var r = 0; r < 3; r++) m[r * 3 + c] = B[r]; return det(m) / D; });
  }
  function suavizar(h, N) {
    var o = new Float32Array(N * N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var s = 0, n = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; s += h[yy * N + xx]; n++;
      }
      o[y * N + x] = s / n;
    }
    return o;
  }

  /* ---------- vista previa 3D (gira sola, se puede arrastrar) ---------- */
  function vistaPrevia(cont, modelo, base) {
    var vivo = true, cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    cont.innerHTML = ''; cont.appendChild(cv);
    var fin = function () { vivo = false; };
    window.cargarThree().then(function (THREE) {
      return window.Menu3DRelieve(THREE, modelo, base).then(function (grupo) {
        if (!vivo) return;
        var w = cont.clientWidth, hh = cont.clientHeight;
        var r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(w, hh, false);
        r.toneMapping = THREE.ACESFilmicToneMapping;
        var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, w / hh, .1, 50);
        sc.add(new THREE.HemisphereLight(0xffffff, 0x8a7a68, 1.1));
        var sol = new THREE.DirectionalLight(0xfff2dc, 1.6); sol.position.set(2, 4, 3); sc.add(sol);
        var giro = new THREE.Group(); giro.add(grupo); sc.add(giro);
        var elev = .7, ang = 0, arr = null;
        cv.onpointerdown = function (e) { arr = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
        cv.onpointermove = function (e) { if (!arr) return; ang += (e.clientX - arr[0]) * .01; elev = Math.max(.15, Math.min(1.45, elev + (e.clientY - arr[1]) * .01)); arr = [e.clientX, e.clientY]; };
        cv.onpointerup = function () { arr = null; };
        (function loop() {
          if (!vivo) { r.dispose(); return; }
          requestAnimationFrame(loop);
          if (!arr) ang += .006;
          giro.rotation.y = ang;
          cam.position.set(0, Math.sin(elev) * 3.2, Math.cos(elev) * 3.2); cam.lookAt(0, .1, 0);
          r.render(sc, cam);
        })();
      });
    }).catch(function (e) { console.error(e); cont.textContent = 'No se pudo mostrar la vista previa.'; });
    return fin;
  }

  /* ---------- pantalla del generador ----------
     abrir(contenedor, fotos, listo): fotos = lista de imágenes (data URL o ruta).
     listo(modelo) se llama cuando el usuario toca "Usar este 3D". Devuelve una función para cerrarla. */
  function abrir(cont, fotos, listo) {
    var sel = 0, img = new Image(), e = null, arr = null, frenar = null;
    cont.innerHTML =
      '<div class="gen">' +
      '<p class="gen-ayuda">1. Elegí la foto donde mejor se ve el plato (desde arriba o un poco inclinada). 2. Mové la elipse para que encierre el plato. 3. Tocá <b>Generar 3D</b>.</p>' +
      '<div class="gen-fotos"></div>' +
      '<div class="gen-lienzo"><canvas></canvas></div>' +
      '<div class="gen-ctrl"><label>Tamaño<input type="range" min="10" max="100" value="45" data-g="t"></label>' +
      '<label>Inclinación de la foto<input type="range" min="30" max="100" value="100" data-g="i"></label>' +
      '<label>Volumen<select data-g="v"><option value=".18">Bajo (pizza, tarta)</option><option value=".3" selected>Medio (carnes, pastas)</option><option value=".55">Alto (hamburguesas, postres altos)</option></select></label></div>' +
      '<div class="gen-acc"><button type="button" class="b p" data-g="gen">Generar 3D</button><span class="gen-msg" aria-live="polite"></span></div>' +
      '<div class="gen-previa" hidden></div>' +
      '<div class="gen-acc" data-g="usar-fila" hidden><button type="button" class="b p" data-g="usar">Usar este 3D</button><span style="color:var(--suave);font-size:.85rem">Arrastrá para girarlo.</span></div>' +
      '</div>';
    var $ = function (s) { return cont.querySelector(s); }, cv = $('.gen-lienzo canvas'), msg = $('.gen-msg'), resultado = null;
    $('.gen-fotos').innerHTML = fotos.map(function (f, i) { return '<button type="button" data-foto="' + i + '"><img src="' + f + '" alt="Foto ' + (i + 1) + '"></button>'; }).join('');
    function marcar() { [].forEach.call(cont.querySelectorAll('[data-foto]'), function (b) { b.setAttribute('aria-pressed', +b.dataset.foto === sel); }); }
    function cargar() {
      marcar(); img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () {
        var k = Math.min(1, 900 / Math.max(img.width, img.height));
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        e = { cx: img.width / 2, cy: img.height / 2, rx: Math.min(img.width, img.height) * .45, ry: Math.min(img.width, img.height) * .45 };
        $('[data-g=t]').value = 45; $('[data-g=i]').value = 100; dibujar();
      };
      img.src = fotos[sel];
    }
    function dibujar() {
      var g = cv.getContext('2d'), k = cv.width / img.width;
      g.drawImage(img, 0, 0, cv.width, cv.height);
      g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.rect(0, 0, cv.width, cv.height);
      g.ellipse(e.cx * k, e.cy * k, e.rx * k, e.ry * k, 0, 0, Math.PI * 2); g.fill('evenodd');
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([10, 6]); g.beginPath(); g.ellipse(e.cx * k, e.cy * k, e.rx * k, e.ry * k, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    function medidas() {
      var t = +$('[data-g=t]').value / 100, i = +$('[data-g=i]').value / 100, m = Math.max(img.width, img.height);
      e.rx = m * t * .5; e.ry = e.rx * i; dibujar();
    }
    $('[data-g=t]').oninput = medidas; $('[data-g=i]').oninput = medidas;
    function punto(ev) { var b = cv.getBoundingClientRect(); return [(ev.clientX - b.left) / b.width * img.width, (ev.clientY - b.top) / b.height * img.height]; }
    cv.onpointerdown = function (ev) { arr = punto(ev); cv.setPointerCapture(ev.pointerId); };
    cv.onpointermove = function (ev) { if (!arr) return; var p = punto(ev); e.cx += p[0] - arr[0]; e.cy += p[1] - arr[1]; arr = p; dibujar(); };
    cv.onpointerup = function () { arr = null; };
    $('.gen-fotos').onclick = function (ev) { var b = ev.target.closest('[data-foto]'); if (b) { sel = +b.dataset.foto; cargar(); } };
    $('[data-g=gen]').onclick = function () {
      var bot = this; bot.disabled = true; msg.textContent = 'Preparando…';
      generar(img, e, function (t) { msg.textContent = t; }).then(function (m) {
        m.altura = +$('[data-g=v]').value; resultado = m;
        msg.textContent = '¡Listo! Así queda tu plato en 3D:';
        $('.gen-previa').hidden = false; $('[data-g=usar-fila]').hidden = false;
        if (frenar) frenar(); frenar = vistaPrevia($('.gen-previa'), m);
      }).catch(function (err) {
        console.error(err); msg.textContent = 'No se pudo generar el 3D en este dispositivo. Probá desde una computadora o con otra foto.';
      }).then(function () { bot.disabled = false; });
    };
    $('[data-g=v]').onchange = function () { if (resultado) { resultado.altura = +this.value; if (frenar) frenar(); frenar = vistaPrevia($('.gen-previa'), resultado); } };
    $('[data-g=usar]').onclick = function () { if (frenar) frenar(); listo(resultado); };
    if (fotos.length) cargar();
    return function () { if (frenar) frenar(); };
  }

  window.Generador3D = { preparar: preparar, generar: generar, abrir: abrir, vistaPrevia: vistaPrevia };
})();
