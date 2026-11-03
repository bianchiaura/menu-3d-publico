/* Menú 3D · motor común del menú.
   Cada página dice qué menú cargar con <body data-menu="carpeta/menu.json">.
   Las fotos y el logo se buscan en la misma carpeta que el menu.json.
   Con ?borrador en el link se muestra la vista previa guardada desde el panel del local. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var ETIQUETAS = { 'sin-tacc': ['Sin TACC', 's'], 'vegano': ['Vegano', 'v'], 'chef': ['Recom. del Chef', ''] };
  var FILTROS = ['sin-tacc', 'vegano'];
  var M = null, base = '', cat = null, filtro = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(r) { return /^(https?:|data:|\/)/.test(r) ? r : base + r; }
  function precio(n) { return (M.moneda || '$') + ' ' + Number(n).toLocaleString('es-AR'); }
  function visibles() { return M.platos.filter(function (d) { return !d.oculto; }); }

  /* colores del local: cualquier clave de "claro"/"oscuro" pasa a ser una variable CSS (--acento, --fondo, …) */
  function colores(c) {
    if (!c) return;
    function vars(o) { return Object.keys(o || {}).map(function (k) { return '--' + k + ':' + o[k]; }).join(';'); }
    var css = ':root{' + vars(c.claro) + '}';
    if (c.oscuro) css += '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + vars(c.oscuro) + '}}:root[data-theme="dark"]{' + vars(c.oscuro) + '}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    if (c.claro && c.claro.acento) {
      var tc = document.querySelector('meta[name="theme-color"]');
      if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc); }
      tc.content = c.claro.acento;
    }
  }

  /* tipografía de los títulos según la identidad del local */
  var TIPOS = {
    clasica: ['Fraunces', null],
    moderna: ["'DM Sans'", null],
    elegante: ["'Cormorant Garamond'", 'Cormorant+Garamond:wght@600;700'],
    rustica: ["'Bitter'", 'Bitter:wght@600;700']
  };
  function tipografia(t) {
    var x = TIPOS[t]; if (!x) return;
    if (x[1]) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + x[1] + '&display=swap'; document.head.appendChild(l); }
    document.documentElement.style.setProperty('--titulos', x[0] + ',Georgia,serif');
  }

  function infoLocal() {
    var i = M.info || {}, l = [];
    if (i.direccion) l.push('<span>📍 ' + esc(i.direccion) + '</span>');
    if (i.horario) l.push('<span>🕒 ' + esc(i.horario) + '</span>');
    if (i.whatsapp) l.push('<a href="https://wa.me/' + esc(String(i.whatsapp).replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (i.instagram) l.push('<a href="https://instagram.com/' + esc(String(i.instagram).replace(/^@/, '')) + '" target="_blank" rel="noopener">Instagram</a>');
    if (M.creditos) l.push('<a href="' + esc(url(M.creditos)) + '">Créditos de las fotos</a>');
    return l.length ? '<footer class="info">' + l.join('') + '</footer>' : '';
  }

  function esqueleto(borrador) {
    document.title = M.nombre + ' · Menú 3D';
    var hay = FILTROS.filter(function (f) { return visibles().some(function (d) { return (d.etiquetas || []).indexOf(f) >= 0; }); });
    document.body.insertAdjacentHTML('afterbegin',
      '<header>' +
      (borrador ? '<div class="proto borr" role="note">Vista previa: cambios todavía sin publicar</div>' : '') +
      (M.prototipo ? '<div class="proto" role="note">Prototipo para ' + esc(M.nombre) + '</div>' : '') +
      '<div class="top">' + (M.logo ? '<img src="' + esc(url(M.logo)) + '" alt="">' : '') +
      '<h1>' + esc(M.nombre) + '<small>' + esc(M.subtitulo || 'Tocá "Ver en 3D" y mirá tu plato sobre la mesa') + '</small></h1></div>' +
      '<nav class="tabs" id="tabs" role="tablist" aria-label="Categorías"></nav>' +
      (hay.length ? '<div class="filtros" id="filtros" aria-label="Filtrar">' + hay.map(function (f) {
        return '<button class="fil" aria-pressed="false" data-fil="' + f + '">' + ETIQUETAS[f][0] + '</button>';
      }).join('') + '</div>' : '') +
      '</header><main id="list"></main>' + infoLocal());
    $('#tabs').onclick = function (e) { var b = e.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat); };
    if ($('#filtros')) $('#filtros').onclick = function (e) {
      var b = e.target.closest('[data-fil]'); if (!b) return;
      filtro = filtro === b.dataset.fil ? null : b.dataset.fil;
      [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', x.dataset.fil === filtro); });
      list();
    };
    $('#list').onclick = function (e) { var b = e.target.closest('[data-3d]'); if (b && window.open3D) window.open3D(b.dataset['3d']); };
  }

  function categorias() {
    return M.categorias.filter(function (c) { return visibles().some(function (d) { return d.categoria === c.id; }); });
  }
  function tabs() {
    $('#tabs').innerHTML = categorias().map(function (c) {
      return '<button class="tab" role="tab" aria-selected="' + (c.id === cat) + '" data-cat="' + esc(c.id) + '">' + esc(c.nombre) + '</button>';
    }).join('');
  }
  function setCat(c) { cat = c; tabs(); list(); scrollTo({ top: 0, behavior: 'smooth' }); }

  function etiqueta(t) {
    var e = ETIQUETAS[t] || [t, ''];
    return '<span class="tag ' + e[1] + '">' + esc(e[0]) + '</span>';
  }
  function list() {
    var C = M.categorias.filter(function (c) { return c.id === cat; })[0];
    if (!C) { $('#list').innerHTML = '<p class="aviso">Todavía no hay platos cargados.</p>'; return; }
    var ps = visibles().filter(function (d) { return d.categoria === cat && (!filtro || (d.etiquetas || []).indexOf(filtro) >= 0); });
    $('#list').innerHTML = '<h2>' + esc(C.nombre) + '</h2>' + (ps.length ? '' : '<p class="aviso">No hay platos ' + esc(ETIQUETAS[filtro][0]) + ' en esta categoría.</p>') + ps.map(function (d) {
      return '<article class="card' + (d.agotado ? ' agotado' : '') + '"><div class="ph"' + (C.fondo ? ' style="background:' + esc(C.fondo) + '"' : '') + '>' +
        (d.foto ? '<img src="' + esc(url(d.foto)) + '" alt="' + esc(d.nombre) + '" loading="lazy">' : '<span aria-hidden="true">' + esc(d.emoji || '🍽') + '</span>') +
        (d.agotado ? '<span class="sin">Sin stock hoy</span>' : '') +
        '</div><div class="bd"><div class="tg">' + (d.etiquetas || []).map(etiqueta).join('') + '</div>' +
        '<h3>' + esc(d.nombre) + '</h3><p>' + esc(d.descripcion) + '</p><div class="ft"><b>' + precio(d.precio) + '</b>' +
        (d.modelo ? '<button class="btn" data-3d="' + esc(d.id) + '" aria-label="Ver ' + esc(d.nombre) + ' en 3D">Ver en 3D</button>' : '') +
        '</div></div></article>';
    }).join('');
  }

  function error(t) {
    document.body.insertAdjacentHTML('afterbegin', '<main><p class="aviso">' + esc(t) + '</p></main>');
  }

  function mostrar(m, borrador) {
    M = window.MENU = m; m.base = base;
    colores(m.colores); tipografia(m.tipografia); esqueleto(borrador);
    cat = categorias()[0] && categorias()[0].id;
    tabs(); list();
    /* con el menú ya visible, se baja el visor 3D de antemano para que "Ver en 3D" abra al instante */
    if (visibles().some(function (d) { return d.modelo; })) setTimeout(function () { if (window.precargar3D) window.precargar3D(); }, 2500);
  }

  var src = document.body.getAttribute('data-menu') || 'menu.json';
  base = src.replace(/[^/]*$/, '');
  if (/[?&]borrador\b/.test(location.search)) {
    try {
      var b = localStorage.getItem('menu3d-borrador:' + new URL(src, location.href).href);
      if (b) { mostrar(JSON.parse(b), true); return; }
    } catch (e) {}
  }
  fetch(src, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (m) { mostrar(m, false); })
    .catch(function (e) {
      if (window.console) console.error(e);
      error('No se pudo cargar el menú. Revisá tu conexión y volvé a abrir la página.');
    });
})();
