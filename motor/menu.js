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

  /* ---------- información del local ----------
     "info": { sobre, direccion, zona, horarios: [{ dias, horas, d: [0..6] }], telefono, whatsapp, email, instagram, reservas, pagos: [], servicios: [] }
     (el viejo "horario" de una sola línea sigue funcionando). Con "muestra": true los datos son inventados:
     se muestran, pero teléfonos, mails y redes no son links, para no contactar a nadie real por error. */
  function horarios(i) { return i.horarios && i.horarios.length ? i.horarios : (i.horario ? [{ dias: 'Horario', horas: i.horario }] : []); }
  function hoy(i) { var d = new Date().getDay(); return horarios(i).filter(function (h) { return h.d && h.d.indexOf(d) >= 0; })[0]; }
  function hayInfo() {
    var i = M.info || {};
    return !!(i.sobre || i.direccion || horarios(i).length || i.telefono || i.whatsapp || i.email || i.instagram || i.reservas || (i.pagos || []).length || (i.servicios || []).length);
  }
  function enlace(texto, href) { return M.muestra || !href ? esc(texto) : '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(texto) + '</a>'; }
  function ficha() {
    var i = M.info || {}, h = horarios(i), t = hoy(i), s = [];
    function bloque(icono, titulo, cuerpo) { s.push('<section><h3><span aria-hidden="true">' + icono + '</span> ' + titulo + '</h3>' + cuerpo + '</section>'); }
    if (i.sobre) bloque('🔥', 'Sobre nosotros', '<p>' + esc(i.sobre) + '</p>');
    if (i.direccion) bloque('📍', 'Dónde estamos', '<p>' + esc(i.direccion) + (i.zona ? '<br><span class="suave">' + esc(i.zona) + '</span>' : '') + '</p>' +
      (M.muestra ? '' : '<p><a class="btn-sec" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.direccion + ' ' + (i.zona || '')) + '" target="_blank" rel="noopener">Cómo llegar</a></p>'));
    if (h.length) bloque('🕒', 'Horarios', '<dl class="horas">' + h.map(function (x) {
      return '<div' + (x === t ? ' class="hoy"' : '') + '><dt>' + esc(x.dias) + (x === t ? ' <em>hoy</em>' : '') + '</dt><dd>' + esc(x.horas) + '</dd></div>';
    }).join('') + '</dl>');
    var c = [];
    if (i.telefono) c.push(['Teléfono', enlace(i.telefono, 'tel:' + String(i.telefono).replace(/[^\d+]/g, ''))]);
    if (i.whatsapp) c.push(['WhatsApp', enlace(i.whatsapp, 'https://wa.me/' + String(i.whatsapp).replace(/\D/g, ''))]);
    if (i.email) c.push(['Mail', enlace(i.email, 'mailto:' + i.email)]);
    if (i.instagram) c.push(['Instagram', enlace(i.instagram, 'https://instagram.com/' + String(i.instagram).replace(/^@/, ''))]);
    if (c.length) bloque('📞', 'Contacto', '<dl class="horas">' + c.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>');
    if (i.reservas) bloque('📅', 'Reservas', '<p>' + esc(i.reservas) + '</p>');
    if ((i.pagos || []).length) bloque('💳', 'Medios de pago', '<p class="chips">' + i.pagos.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    if ((i.servicios || []).length) bloque('✨', 'Servicios', '<p class="chips">' + i.servicios.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    return '<dialog class="ficha" id="ficha" aria-labelledby="ficha-t"><div class="ficha-cab"><h2 id="ficha-t">' + esc(M.nombre) + '</h2>' +
      '<button class="ficha-x" data-cerrar-ficha aria-label="Cerrar">✕</button></div><div class="ficha-cuerpo">' + s.join('') +
      (M.muestra ? '<p class="muestra">Restaurante y datos de muestra, inventados para la demostración.</p>' : '') + '</div></dialog>';
  }
  function infoLocal() {
    var i = M.info || {}, l = [], t = hoy(i), h = horarios(i);
    if (i.direccion) l.push('<span>📍 ' + esc(i.direccion) + '</span>');
    if (t) l.push('<span>🕒 Hoy: ' + esc(t.horas) + '</span>'); else if (h.length === 1) l.push('<span>🕒 ' + esc(h[0].horas) + '</span>');
    if (hayInfo()) l.push('<button class="ver-ficha" data-abrir-ficha>Horarios, contacto y más</button>');
    if (M.creditos) l.push('<a href="' + esc(url(M.creditos)) + '">Créditos de las fotos</a>');
    return (l.length ? '<footer class="info">' + l.join('') + '</footer>' : '') + (hayInfo() ? ficha() : '');
  }

  function esqueleto(borrador) {
    document.title = M.nombre + ' · Menú 3D';
    var hay = FILTROS.filter(function (f) { return visibles().some(function (d) { return (d.etiquetas || []).indexOf(f) >= 0; }); });
    document.body.insertAdjacentHTML('afterbegin',
      '<header>' +
      (borrador ? '<div class="proto borr" role="note">Vista previa: cambios todavía sin publicar</div>' : '') +
      (M.prototipo ? '<div class="proto" role="note">Prototipo para ' + esc(M.nombre) + '</div>' : '') +
      '<div class="top">' + (M.logo ? '<img src="' + esc(url(M.logo)) + '" alt="">' : '') +
      '<h1>' + esc(M.nombre) + '<small>' + esc(M.subtitulo || 'Tocá "Ver en 3D" y mirá tu plato sobre la mesa') + '</small></h1>' +
      (hayInfo() ? '<button class="btn-info" data-abrir-ficha aria-label="Información del local: horarios, dirección y contacto">' +
        /* la "i" clásica de información: círculo con una i en cursiva (dibujada, no emoji, para que se vea igual en todos los celulares) */
        '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="9.25" class="i-fondo"/>' +
        '<circle cx="11.1" cy="5.6" r="1.35" class="i-letra"/><path d="M9.4 8.4h2.6l-1.55 6.1c-.12.48.08.7.45.7.35 0 .72-.2 1.05-.5l.3.45c-.68.82-1.55 1.3-2.45 1.3-1.08 0-1.5-.68-1.25-1.7l1.15-4.6h-.9z" class="i-letra"/></svg>Info</button>' : '') + '</div>' +
      '<nav class="tabs" id="tabs" role="tablist" aria-label="Categorías"></nav>' +
      (hay.length ? '<div class="filtros" id="filtros" aria-label="Filtrar">' + hay.map(function (f) {
        return '<button class="fil" aria-pressed="false" data-fil="' + f + '">' + ETIQUETAS[f][0] + '</button>';
      }).join('') + '</div>' : '') +
      '</header><main id="list"></main>' + infoLocal());
    $('#tabs').onclick = function (e) { var b = e.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat); };
    document.addEventListener('click', function (e) {
      var f = $('#ficha'); if (!f) return;
      if (e.target.closest('[data-abrir-ficha]')) f.showModal();
      else if (e.target.closest('[data-cerrar-ficha]') || e.target === f) f.close(); /* tocar afuera también la cierra */
    });
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
      return '<article class="card' + (d.agotado ? ' agotado' : '') + '" id="plato-' + esc(d.id) + '"><div class="ph"' + (C.fondo ? ' style="background:' + esc(C.fondo) + '"' : '') + '>' +
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
    document.dispatchEvent(new CustomEvent('menu-listo')); /* avisa a los agregados (ej. la mascota) */
  }

  /* lleva a un plato: abre su categoría, saca el filtro, lo muestra y lo resalta un momento */
  window.irAPlato = function (id) {
    var p = M.platos.filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
    cat = p.categoria; filtro = null;
    [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', 'false'); });
    tabs(); list();
    var t = document.querySelector('.tab[aria-selected=true]'); if (t) t.scrollIntoView({ inline: 'center', block: 'nearest' });
    var c = document.getElementById('plato-' + p.id); if (!c) return;
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    c.classList.add('destacado'); setTimeout(function () { c.classList.remove('destacado'); }, 2200);
  };

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
