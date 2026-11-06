/* Menú 3D · motor común del menú.
   Cada página dice qué menú cargar con <body data-menu="carpeta/menu.json">.
   Las fotos y el logo se buscan en la misma carpeta que el menu.json.
   Con ?borrador en el link se muestra la vista previa guardada desde el panel del local.
   Idiomas: si el menu.json trae "en" (traducción al inglés), aparece el botón EN/ES; si el celular
   del cliente no está en español, arranca en inglés. Lo que no esté traducido se muestra en español. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var FILTROS = ['sin-tacc', 'vegano'];
  var M = null, base = '', cat = null, filtro = null, idioma = 'es', borrador = false;

  /* ---------- textos de la interfaz ---------- */
  var TXT = {
    es: {
      etiquetas: { 'sin-tacc': 'Sin TACC', 'vegano': 'Vegano', 'chef': 'Recom. del Chef' },
      subtitulo: 'Tocá "Ver en 3D" y mirá tu plato sobre la mesa', ver3d: 'Ver en 3D', ver3dDe: 'Ver {x} en 3D', sinStock: 'Sin stock hoy',
      sinPlatos: 'Todavía no hay platos cargados.', ningunoFiltro: 'No hay platos {x} en esta categoría.',
      previa: 'Vista previa: cambios todavía sin publicar', prototipo: 'Prototipo para {x}', categorias: 'Categorías', filtrar: 'Filtrar',
      info: 'Información del local: horarios, dirección y contacto', sobre: 'Sobre nosotros', donde: 'Dónde estamos', llegar: 'Cómo llegar',
      horarios: 'Horarios', hoy: 'hoy', hoyPie: 'Hoy', contacto: 'Contacto', telefono: 'Teléfono', mail: 'Mail', reservas: 'Reservas',
      pagos: 'Medios de pago', servicios: 'Servicios', cerrar: 'Cerrar', muestra: 'Restaurante y datos de muestra, inventados para la demostración.',
      verFicha: 'Horarios, contacto y más', creditos: 'Créditos de las fotos', horario: 'Horario', otroIdioma: 'EN', otroIdiomaNombre: 'English',
      error: 'No se pudo cargar el menú. Revisá tu conexión y volvé a abrir la página.'
    },
    en: {
      etiquetas: { 'sin-tacc': 'Gluten-free', 'vegano': 'Vegan', 'chef': "Chef's pick" },
      subtitulo: 'Tap "View in 3D" and see your dish on the table', ver3d: 'View in 3D', ver3dDe: 'View {x} in 3D', sinStock: 'Sold out today',
      sinPlatos: 'No dishes yet.', ningunoFiltro: 'No {x} dishes in this category.',
      previa: 'Preview: changes not published yet', prototipo: 'Prototype for {x}', categorias: 'Categories', filtrar: 'Filter',
      info: 'Restaurant info: hours, address and contact', sobre: 'About us', donde: 'Where we are', llegar: 'Directions',
      horarios: 'Opening hours', hoy: 'today', hoyPie: 'Today', contacto: 'Contact', telefono: 'Phone', mail: 'Email', reservas: 'Reservations',
      pagos: 'Payment methods', servicios: 'Amenities', cerrar: 'Close', muestra: 'Sample restaurant and data, made up for this demo.',
      verFicha: 'Hours, contact and more', creditos: 'Photo credits', horario: 'Hours', otroIdioma: 'ES', otroIdiomaNombre: 'Español',
      error: "We couldn't load the menu. Check your connection and open the page again."
    }
  };
  function t(k, x) { var v = (TXT[idioma] || TXT.es)[k]; return x == null ? v : v.replace('{x}', x); }
  function en() { return idioma === 'en' && M.en ? M.en : null; }
  /* textos del local en el idioma elegido (si falta la traducción, queda el español) */
  function nombreCat(c) { var e = en(); return (e && e.categorias && e.categorias[c.id]) || c.nombre; }
  function textoPlato(d) {
    var e = en(), x = e && e.platos && e.platos[d.id];
    return { nombre: (x && x.nombre) || d.nombre, descripcion: (x && x.descripcion) || d.descripcion };
  }
  function infoT() {
    var i = M.info || {}, e = en(), x = (e && e.info) || {}, o = {};
    Object.keys(i).forEach(function (k) { o[k] = i[k]; });
    ['sobre', 'zona', 'reservas', 'pagos', 'servicios'].forEach(function (k) { if (x[k] && x[k].length) o[k] = x[k]; });
    if (x.horarios && i.horarios) o.horarios = i.horarios.map(function (h, n) { var tr = x.horarios[n] || {}; return { dias: tr.dias || h.dias, horas: tr.horas || h.horas, d: h.d }; });
    return o;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* rutas de fotos y links: nunca "javascript:" ni nada raro, aunque alguien lo escriba en el menu.json */
  function url(r) {
    r = String(r || '');
    if (/^\s*(javascript|vbscript|data:text)/i.test(r)) return '#';
    return /^(https?:|data:image\/|\/)/.test(r) ? r : base + r;
  }
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
  function tipografia(tp) {
    var x = TIPOS[tp]; if (!x) return;
    if (x[1]) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + x[1] + '&display=swap'; document.head.appendChild(l); }
    document.documentElement.style.setProperty('--titulos', x[0] + ',Georgia,serif');
  }

  /* ---------- información del local ----------
     "info": { sobre, direccion, zona, horarios: [{ dias, horas, d: [0..6] }], telefono, whatsapp, email, instagram, reservas, pagos: [], servicios: [] }
     (el viejo "horario" de una sola línea sigue funcionando). Con "muestra": true los datos son inventados:
     se muestran, pero teléfonos, mails y redes no son links, para no contactar a nadie real por error. */
  function horarios(i) { return i.horarios && i.horarios.length ? i.horarios : (i.horario ? [{ dias: t('horario'), horas: i.horario }] : []); }
  function hoy(i) { var d = new Date().getDay(); return horarios(i).filter(function (h) { return h.d && h.d.indexOf(d) >= 0; })[0]; }
  function hayInfo() {
    var i = M.info || {};
    return !!(i.sobre || i.direccion || horarios(i).length || i.horarioNota || i.telefono || i.whatsapp || i.email || i.instagram || i.reservas || (i.pagos || []).length || (i.servicios || []).length);
  }
  function enlace(texto, href) { return M.muestra || !href ? esc(texto) : '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(texto) + '</a>'; }
  function ficha() {
    var i = infoT(), h = horarios(i), hy = hoy(i), s = [];
    function bloque(icono, titulo, cuerpo) { s.push('<section><h3><span aria-hidden="true">' + icono + '</span> ' + titulo + '</h3>' + cuerpo + '</section>'); }
    if (i.sobre) bloque('🔥', t('sobre'), '<p>' + esc(i.sobre) + '</p>');
    if (i.direccion) bloque('📍', t('donde'), '<p>' + esc(i.direccion) + (i.zona ? '<br><span class="suave">' + esc(i.zona) + '</span>' : '') + '</p>' +
      (M.muestra ? '' : '<p><a class="btn-sec" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.direccion + ' ' + (i.zona || '')) + '" target="_blank" rel="noopener">' + t('llegar') + '</a></p>'));
    if (h.length || i.horarioNota) bloque('🕒', t('horarios'), (h.length ? '<dl class="horas">' + h.map(function (x) {
      var esHoy = hy && x.d === hy.d && x.dias === hy.dias;
      return '<div' + (esHoy ? ' class="hoy"' : '') + '><dt>' + esc(x.dias) + (esHoy ? ' <em>' + t('hoy') + '</em>' : '') + '</dt><dd>' + esc(x.horas) + '</dd></div>';
    }).join('') + '</dl>' : '') + (i.horarioNota ? '<p class="suave">' + esc(i.horarioNota) + '</p>' : '')); /* la aclaración (ej. la cafetería) va abajo */
    var c = [];
    if (i.telefono) c.push([t('telefono'), enlace(i.telefono, 'tel:' + String(i.telefono).replace(/[^\d+]/g, ''))]);
    if (i.whatsapp) c.push(['WhatsApp', enlace(i.whatsapp, 'https://wa.me/' + String(i.whatsapp).replace(/\D/g, ''))]);
    if (i.email) c.push([t('mail'), enlace(i.email, 'mailto:' + i.email)]);
    if (i.instagram) c.push(['Instagram', enlace(i.instagram, 'https://instagram.com/' + String(i.instagram).replace(/^@/, ''))]);
    if (c.length) bloque('📞', t('contacto'), '<dl class="horas">' + c.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>');
    if (i.reservas) bloque('📅', t('reservas'), '<p>' + esc(i.reservas) + '</p>');
    if ((i.pagos || []).length) bloque('💳', t('pagos'), '<p class="chips">' + i.pagos.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    if ((i.servicios || []).length) bloque('✨', t('servicios'), '<p class="chips">' + i.servicios.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    return '<dialog class="ficha" id="ficha" aria-labelledby="ficha-t"><div class="ficha-cab"><h2 id="ficha-t">' + esc(M.nombre) + '</h2>' +
      '<button class="ficha-x" data-cerrar-ficha aria-label="' + t('cerrar') + '">✕</button></div><div class="ficha-cuerpo">' + s.join('') +
      (M.muestra ? '<p class="muestra">' + t('muestra') + '</p>' : '') + '</div></dialog>';
  }
  /* "Créditos de las fotos": solo mientras quede a la vista alguna foto (o 3D) que no es del local.
     "fotosConCredito" lista esas fotos; las que sube el local tienen otra ruta, así que al reemplazarlas el link desaparece solo. */
  function conCreditos() {
    if (!M.creditos) return false;
    var l = M.fotosConCredito; if (!l) return true;
    return visibles().some(function (d) { return l.indexOf(d.foto) >= 0 || (d.modelo && l.indexOf(d.modelo.textura) >= 0); });
  }
  function infoLocal() {
    var i = infoT(), l = [], hy = hoy(i), h = horarios(i);
    if (i.direccion) l.push('<span>📍 ' + esc(i.direccion) + '</span>');
    if (hy) l.push('<span>🕒 ' + t('hoyPie') + ': ' + esc(hy.horas) + '</span>'); else if (h.length === 1) l.push('<span>🕒 ' + esc(h[0].horas) + '</span>');
    if (hayInfo()) l.push('<button class="ver-ficha" data-abrir-ficha>' + t('verFicha') + '</button>');
    if (conCreditos()) l.push('<a href="' + esc(url(M.creditos)) + '">' + t('creditos') + '</a>');
    return (l.length ? '<footer class="info">' + l.join('') + '</footer>' : '') + (hayInfo() ? ficha() : '');
  }

  function esqueleto() {
    document.title = M.nombre + ' · Menú 3D';
    document.documentElement.lang = idioma;
    var e = en(), hay = FILTROS.filter(function (f) { return visibles().some(function (d) { return (d.etiquetas || []).indexOf(f) >= 0; }); });
    document.body.insertAdjacentHTML('afterbegin',
      '<header>' +
      (borrador ? '<div class="proto borr" role="note">' + t('previa') + '</div>' : '') +
      (M.prototipo ? '<div class="proto" role="note">' + t('prototipo', esc(M.nombre)) + '</div>' : '') +
      '<div class="top">' + (M.logo ? '<img src="' + esc(url(M.logo)) + '" alt="">' : '') +
      '<h1>' + esc(M.nombre) + '<small>' + esc((e && e.subtitulo) || (idioma === 'es' && M.subtitulo) || t('subtitulo')) + '</small></h1>' +
      (M.en ? '<button class="btn-idioma" data-idioma lang="' + (idioma === 'es' ? 'en' : 'es') + '" aria-label="' + t('otroIdiomaNombre') + '">' + t('otroIdioma') + '</button>' : '') +
      (hayInfo() ? '<button class="btn-info" data-abrir-ficha aria-label="' + t('info') + '">' +
        /* la "i" clásica de información: círculo con una i en cursiva (dibujada, no emoji, para que se vea igual en todos los celulares) */
        '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="9.25" class="i-fondo"/>' +
        '<circle cx="11.1" cy="5.6" r="1.35" class="i-letra"/><path d="M9.4 8.4h2.6l-1.55 6.1c-.12.48.08.7.45.7.35 0 .72-.2 1.05-.5l.3.45c-.68.82-1.55 1.3-2.45 1.3-1.08 0-1.5-.68-1.25-1.7l1.15-4.6h-.9z" class="i-letra"/></svg>Info</button>' : '') + '</div>' +
      '<nav class="tabs" id="tabs" role="tablist" aria-label="' + t('categorias') + '"></nav>' +
      (hay.length ? '<div class="filtros" id="filtros" aria-label="' + t('filtrar') + '">' + hay.map(function (f) {
        return '<button class="fil" aria-pressed="' + (filtro === f) + '" data-fil="' + f + '">' + t('etiquetas')[f] + '</button>';
      }).join('') + '</div>' : '') +
      '</header><main id="list"></main>' + infoLocal());
    $('#tabs').onclick = function (ev) { var b = ev.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat); };
    if ($('#filtros')) $('#filtros').onclick = function (ev) {
      var b = ev.target.closest('[data-fil]'); if (!b) return;
      filtro = filtro === b.dataset.fil ? null : b.dataset.fil;
      [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', x.dataset.fil === filtro); });
      list();
    };
    $('#list').onclick = function (ev) { var b = ev.target.closest('[data-3d]'); if (b && window.open3D) window.open3D(b.dataset['3d']); };
  }
  /* dibuja (o vuelve a dibujar, al cambiar de idioma) todo el menú */
  function pintar() {
    ['header', '#list', 'footer.info', '#ficha'].forEach(function (s) { var x = $(s); if (x) x.remove(); });
    esqueleto(); tabs(); list();
  }

  function categorias() {
    return M.categorias.filter(function (c) { return visibles().some(function (d) { return d.categoria === c.id; }); });
  }
  function tabs() {
    $('#tabs').innerHTML = categorias().map(function (c) {
      return '<button class="tab" role="tab" aria-selected="' + (c.id === cat) + '" data-cat="' + esc(c.id) + '">' + esc(nombreCat(c)) + '</button>';
    }).join('');
  }
  function setCat(c) { cat = c; tabs(); list(); scrollTo({ top: 0, behavior: 'smooth' }); }

  function etiqueta(tg) {
    var nombre = t('etiquetas')[tg] || tg, clase = { 'sin-tacc': 's', 'vegano': 'v' }[tg] || '';
    return '<span class="tag ' + clase + '">' + esc(nombre) + '</span>';
  }
  function list() {
    var C = M.categorias.filter(function (c) { return c.id === cat; })[0];
    if (!C) { $('#list').innerHTML = '<p class="aviso">' + t('sinPlatos') + '</p>'; return; }
    var ps = visibles().filter(function (d) { return d.categoria === cat && (!filtro || (d.etiquetas || []).indexOf(filtro) >= 0); });
    $('#list').innerHTML = '<h2>' + esc(nombreCat(C)) + '</h2>' + (ps.length ? '' : '<p class="aviso">' + esc(t('ningunoFiltro', t('etiquetas')[filtro])) + '</p>') + ps.map(function (d) {
      var x = textoPlato(d);
      return '<article class="card' + (d.agotado ? ' agotado' : '') + '" id="plato-' + esc(d.id) + '"><div class="ph"' + (C.fondo ? ' style="background:' + esc(C.fondo) + '"' : '') + '>' +
        (d.foto ? '<img src="' + esc(url(d.foto)) + '" alt="' + esc(x.nombre) + '" loading="lazy">' : '<span aria-hidden="true">' + esc(d.emoji || '🍽') + '</span>') +
        (d.agotado ? '<span class="sin">' + t('sinStock') + '</span>' : '') +
        '</div><div class="bd"><div class="tg">' + (d.etiquetas || []).map(etiqueta).join('') + '</div>' +
        '<h3>' + esc(x.nombre) + '</h3><p>' + esc(x.descripcion) + '</p><div class="ft"><b>' + precio(d.precio) + '</b>' +
        (d.modelo ? '<button class="btn" data-3d="' + esc(d.id) + '" aria-label="' + esc(t('ver3dDe', x.nombre)) + '">' + t('ver3d') + '</button>' : '') +
        '</div></div></article>';
    }).join('');
  }

  function error(tx) {
    document.body.insertAdjacentHTML('afterbegin', '<main><p class="aviso">' + esc(tx) + '</p></main>');
  }

  function mostrar(m, esBorrador) {
    /* lo que el plan del local no incluye no se muestra (los datos quedan guardados por si cambia de plan) */
    if (m.incluye) { if (m.incluye.ingles === false) delete m.en; if (m.incluye.mascota === false) delete m.mascota; }
    M = window.MENU = m; m.base = base; borrador = esBorrador;
    /* idioma: el que eligió antes en este celular; si no, inglés cuando el celular no está en español */
    var guardado = null; try { guardado = localStorage.getItem('menu3d-idioma'); } catch (e) {}
    idioma = m.en ? (guardado || (/^es\b/i.test(navigator.language || 'es') ? 'es' : 'en')) : 'es';
    window.idiomaMenu = idioma;
    colores(m.colores); tipografia(m.tipografia);
    cat = categorias()[0] && categorias()[0].id;
    pintar();
    document.addEventListener('click', function (ev) {
      var f = $('#ficha');
      if (ev.target.closest('[data-idioma]')) { cambiarIdioma(idioma === 'es' ? 'en' : 'es'); return; }
      if (!f) return;
      if (ev.target.closest('[data-abrir-ficha]')) f.showModal();
      else if (ev.target.closest('[data-cerrar-ficha]') || ev.target === f) f.close(); /* tocar afuera también la cierra */
    });
    /* con el menú ya visible, se baja el visor 3D de antemano para que "Ver en 3D" abra al instante */
    if (visibles().some(function (d) { return d.modelo; })) setTimeout(function () { if (window.precargar3D) window.precargar3D(); }, 2500);
    document.dispatchEvent(new CustomEvent('menu-listo')); /* avisa a los agregados (ej. la mascota) */
    contar('menu');
  }
  /* ---------- estadísticas ----------
     Anota en Supabase que se abrió el menú o se miró un plato en 3D / AR. Solo se guarda el local, el plato,
     el tipo y el idioma: nada de quién mira. No cuenta la vista previa, las pruebas en la compu ni los
     navegadores donde alguien inició sesión en un panel (para que el local no se cuente a sí mismo). */
  var SB = 'https://nudadncqyagovqzdkbuq.supabase.co', SB_CLAVE = 'sb_publishable_TE00ghT-FzqJTFkT5WwXKA_N_943Wz6';
  function contar(tipo, plato) {
    if (borrador || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try { if (localStorage.getItem('menu3d-no-contar')) return; } catch (e) {}
    var partes = new URL(src, location.href).pathname.split('/'), carpeta = partes[partes.length - 2] || '';
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(carpeta) || carpeta === 'plantilla') return;
    if (tipo === 'menu') { /* una vez por visita (recargar la página no suma) */
      try { if (sessionStorage.getItem('menu3d-contado:' + carpeta)) return; sessionStorage.setItem('menu3d-contado:' + carpeta, '1'); } catch (e) {}
    }
    try {
      fetch(SB + '/rest/v1/vistas', {
        method: 'POST', keepalive: true,
        headers: { apikey: SB_CLAVE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ carpeta: carpeta, tipo: tipo, plato: plato == null ? null : String(plato).slice(0, 20), idioma: idioma })
      }).catch(function () {});
    } catch (e) {}
  }
  window.contarVista = contar;

  function cambiarIdioma(nuevo) {
    idioma = window.idiomaMenu = nuevo;
    try { localStorage.setItem('menu3d-idioma', nuevo); } catch (e) {}
    var y = scrollY; pintar(); scrollTo(0, y);
    document.dispatchEvent(new CustomEvent('menu-idioma'));
  }
  /* para el visor 3D y la mascota: nombre y descripción del plato en el idioma elegido */
  window.textoPlato = function (d) { return M ? textoPlato(d) : d; };

  /* lleva a un plato: abre su categoría, saca el filtro, lo muestra y lo resalta un momento */
  window.irAPlato = function (id) {
    var p = M.platos.filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
    cat = p.categoria; filtro = null;
    [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', 'false'); });
    tabs(); list();
    var tb = document.querySelector('.tab[aria-selected=true]'); if (tb) tb.scrollIntoView({ inline: 'center', block: 'nearest' });
    var c = document.getElementById('plato-' + p.id); if (!c) return;
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    c.classList.add('destacado'); setTimeout(function () { c.classList.remove('destacado'); }, 2200);
  };

  var src = document.body.getAttribute('data-menu') || 'menu.json', yo = document.currentScript && document.currentScript.src;
  base = src.replace(/[^/]*$/, '');
  function publicado() {
    fetch(src, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) { mostrar(m, false); })
      .catch(function (e) {
        if (window.console) console.error(e);
        error(/^es\b/i.test(navigator.language || 'es') ? TXT.es.error : TXT.en.error);
      });
  }
  /* vista previa: el borrador lo guardó el panel con almacen.js, que se carga solo en este caso */
  if (/[?&]borrador\b/.test(location.search) && yo) {
    var s = document.createElement('script'); s.src = yo.replace(/menu\.js(\?.*)?$/, 'almacen.js');
    s.onload = function () {
      Almacen.leer('menu3d-borrador:' + new URL(src, location.href).href).then(function (b) {
        var d = b && JSON.parse(b); if (d && d.menu) d = d.menu;
        if (d) mostrar(d, true); else publicado();
      }).catch(publicado);
    };
    s.onerror = publicado;
    document.head.appendChild(s);
  } else publicado();
})();
