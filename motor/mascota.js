/* Menú 3D · personajito del local (opcional).
   Se activa si el menu.json tiene, por ejemplo:
   "mascota": { "nombre": "Brasita", "frases": ["…"], "recomienda": ["Hoy pedite {plato}", "…"] }
   Vive abajo a la izquierda. Al tocarlo salta, dice una frase y recomienda un plato al azar;
   "Ver plato" lleva a ese plato. Se puede ocultar (se recuerda en este celular). */
(function () {
  'use strict';
  var CLAVE = 'menu3d-mascota-oculta';
  var ojos = '<g class="m-ojos"><ellipse cx="25.5" cy="43" rx="4.2" ry="5" fill="#fff"/><ellipse cx="38.5" cy="43" rx="4.2" ry="5" fill="#fff"/>' +
    '<circle class="m-pupila" cx="26.3" cy="44" r="2.4" fill="#3a1606"/><circle class="m-pupila" cx="39.3" cy="44" r="2.4" fill="#3a1606"/>' +
    '<circle cx="27.2" cy="42.6" r=".9" fill="#fff"/><circle cx="40.2" cy="42.6" r=".9" fill="#fff"/></g>' +
    '<g class="m-feliz"><path d="M21.8 44.5q3.7-4.6 7.4 0M34.8 44.5q3.7-4.6 7.4 0" fill="none" stroke="#3a1606" stroke-width="2.2" stroke-linecap="round"/></g>';
  /* dibujo: una brasa-llamita con cara (original, hecho con formas simples) */
  var DIBUJO = '<svg viewBox="0 0 64 72" aria-hidden="true">' +
    '<defs><linearGradient id="m-fuego" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb627"/><stop offset=".55" stop-color="#ff7a1a"/><stop offset="1" stop-color="#e2470f"/></linearGradient>' +
    '<linearGradient id="m-centro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#ffc93c"/></linearGradient></defs>' +
    '<ellipse class="m-sombra" cx="32" cy="68" rx="15" ry="3" fill="rgba(0,0,0,.18)"/>' +
    '<g class="m-cuerpo">' +
    '<path d="M32 4c8 12 20 18 20 36 0 15-9 26-20 26S12 55 12 40c0-10 6-16 10-22 1 8 4 11 7 12-2-10 0-19 3-26z" fill="url(#m-fuego)"/>' +
    '<path d="M32 30c5 7 10 11 10 20 0 8-5 12-10 12s-10-4-10-12c0-6 4-10 6-14 1 4 3 5 5 5-1-4-2-7-1-11z" fill="url(#m-centro)" opacity=".9"/>' +
    '<circle cx="20.5" cy="51" r="3.2" fill="#ff5a5f" opacity=".45"/><circle cx="43.5" cy="51" r="3.2" fill="#ff5a5f" opacity=".45"/>' +
    ojos +
    '<path class="m-boca" d="M28.5 52.5q3.5 4 7 0" fill="none" stroke="#3a1606" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse class="m-boca-abierta" cx="32" cy="54" rx="3" ry="2.6" fill="#3a1606"/>' +
    '</g></svg>';

  var M, cfg, raiz, globo, plato = null, ultimaFrase = -1, ultimoPlato = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function oculta() { try { return localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; } }
  function azar(l, evitar) { if (!l.length) return null; var x; do { x = Math.floor(Math.random() * l.length); } while (l.length > 1 && x === evitar); return x; }

  function decir() {
    var frases = cfg.frases || [], reco = cfg.recomienda || ['Hoy pedite {plato}'];
    var platos = M.platos.filter(function (p) { return !p.oculto && !p.agotado && p !== ultimoPlato; });
    var i = azar(platos);
    plato = i == null ? null : platos[i]; ultimoPlato = plato;
    var f = azar(frases, ultimaFrase); ultimaFrase = f;
    var r = reco[Math.floor(Math.random() * reco.length)];
    globo.querySelector('.m-texto').innerHTML =
      (f != null ? '<p>' + esc(frases[f]) + '</p>' : '') +
      (plato ? '<p class="m-reco">' + esc(r).replace('{plato}', '<b>' + esc(plato.nombre) + '</b>') + '</p>' : '');
    globo.querySelector('[data-m=ver]').hidden = !plato;
  }

  function abrir() {
    raiz.classList.remove('salta'); void raiz.offsetWidth; raiz.classList.add('salta', 'charla');
    decir(); globo.hidden = false;
  }
  function cerrar() { globo.hidden = true; raiz.classList.remove('charla'); }

  function armar() {
    raiz = document.createElement('div');
    raiz.className = 'mascota';
    raiz.innerHTML =
      '<div class="m-globo" role="status" aria-live="polite" hidden><button class="m-x" data-m="cerrar" aria-label="Cerrar">✕</button>' +
      '<div class="m-texto"></div><div class="m-acciones"><button data-m="ver">Ver plato</button><button data-m="otra">Otra idea</button></div>' +
      '<button class="m-ocultar" data-m="ocultar">Ocultar a ' + esc(cfg.nombre || 'la mascota') + '</button></div>' +
      '<button class="m-boton" data-m="tocar" aria-label="' + esc(cfg.nombre || 'Mascota') + ': tocá para que te recomiende un plato">' + DIBUJO + '</button>';
    document.body.appendChild(raiz); document.body.classList.add('con-mascota');
    globo = raiz.querySelector('.m-globo');
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      var a = b.dataset.m;
      if (a === 'tocar') { if (globo.hidden) abrir(); else { raiz.classList.remove('salta'); void raiz.offsetWidth; raiz.classList.add('salta'); decir(); } }
      if (a === 'otra') { raiz.classList.remove('salta'); void raiz.offsetWidth; raiz.classList.add('salta'); decir(); }
      if (a === 'cerrar') cerrar();
      if (a === 'ver' && plato && window.irAPlato) { cerrar(); window.irAPlato(plato.id); }
      if (a === 'ocultar') { try { localStorage.setItem(CLAVE, '1'); } catch (err) {} quitar(); }
    });
    /* una sola vez, a los pocos segundos, saluda para que se note que se puede tocar */
    setTimeout(function () { if (raiz.isConnected && globo.hidden) { raiz.classList.add('saluda'); setTimeout(function () { raiz.classList.remove('saluda'); }, 1600); } }, 6000);
  }
  function quitar() {
    if (raiz) raiz.remove(); raiz = null; document.body.classList.remove('con-mascota');
    var pie = document.querySelector('footer.info');
    if (pie && !pie.querySelector('[data-volver-mascota]')) {
      pie.insertAdjacentHTML('beforeend', '<button class="ver-ficha" data-volver-mascota>Volver a ver a ' + esc(cfg.nombre || 'la mascota') + '</button>');
      pie.querySelector('[data-volver-mascota]').onclick = function () {
        try { localStorage.removeItem(CLAVE); } catch (e) {}
        this.remove(); armar();
      };
    }
  }

  function iniciar() {
    if (M) return; /* una sola vez */
    M = window.MENU; cfg = M && M.mascota; if (!cfg) { M = null; return; }
    if (oculta()) { quitar(); return; }
    armar();
  }
  /* tocar en cualquier otro lado cierra el globo */
  document.addEventListener('click', function (e) { if (raiz && !globo.hidden && !raiz.contains(e.target)) cerrar(); });
  document.addEventListener('menu-listo', iniciar);
  if (window.MENU && document.querySelector('header')) iniciar(); /* por si el menú cargó antes (vista previa) */
})();
