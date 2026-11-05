/* Menú 3D · estadísticas en los paneles (lee de Supabase con sesion.js).
   - Estadisticas.local(contenedor, carpeta, menu): pestaña "Estadísticas" del panel de un local
   - Estadisticas.porLocal(): { carpeta: { menu, menu7, d3, ar, ... } } para el panel del administrador
   - Estadisticas.resumen(carpeta, menu): texto corto del último mes, para mandarle al local por WhatsApp
   Las visitas las anota el menú público (motor/menu.js y visor3d.js) en la tabla "vistas". */
window.Estadisticas = (function () {
  'use strict';
  var DIAS = 30;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fecha(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function ultimosDias(n) { var l = [], h = new Date(); for (var i = n - 1; i >= 0; i--) l.push(fecha(new Date(h.getFullYear(), h.getMonth(), h.getDate() - i))); return l; }
  function num(n) { return Number(n).toLocaleString('es-AR'); }
  function corta(dia) { var p = dia.split('-'); return Number(p[2]) + '/' + Number(p[1]); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  function sumar(filas) {
    var dias = ultimosDias(DIAS), semana = dias.slice(-7), r = { menu: 0, menu7: 0, d3: 0, ar: 0, porDia: {}, platos: {} };
    dias.forEach(function (d) { r.porDia[d] = 0; });
    filas.forEach(function (f) {
      var c = Number(f.cantidad) || 0;
      if (f.tipo === 'menu') {
        r.menu += c; if (semana.indexOf(f.dia) >= 0) r.menu7 += c;
        if (f.dia in r.porDia) r.porDia[f.dia] += c;
      } else {
        if (f.tipo === '3d') r.d3 += c; else r.ar += c;
        if (f.plato != null) { var p = r.platos[f.plato] = r.platos[f.plato] || { d3: 0, ar: 0 }; p[f.tipo === '3d' ? 'd3' : 'ar'] += c; }
      }
    });
    return r;
  }
  /* aperturas por hora e idioma: { total, en, porHora: [24] } */
  function sumarAperturas(filas) {
    var r = { total: 0, en: 0, porHora: [] }; for (var i = 0; i < 24; i++) r.porHora.push(0);
    filas.forEach(function (f) {
      var c = Number(f.cantidad) || 0; r.total += c;
      if (f.idioma === 'en') r.en += c;
      if (f.hora >= 0 && f.hora < 24) r.porHora[f.hora] += c;
    });
    return r;
  }
  function horaPico(a) {
    var mejor = -1, max = 0; a.porHora.forEach(function (v, h) { if (v > max) { max = v; mejor = h; } });
    return mejor < 0 ? null : mejor + ' a ' + ((mejor + 1) % 24 || 24) + ' h';
  }
  /* platos con nombre, ordenados por cuántas veces se miraron en 3D/AR */
  function platosVistos(r, M) {
    return Object.keys(r.platos).map(function (id) {
      var p = (M && M.platos || []).filter(function (x) { return String(x.id) === id; })[0];
      return { nombre: p ? p.nombre : 'Plato borrado', d3: r.platos[id].d3, ar: r.platos[id].ar };
    }).sort(function (a, b) { return (b.d3 + b.ar) - (a.d3 + a.ar); });
  }
  /* platos con 3D que nadie miró en el mes */
  function sinMirar(r, M) {
    return (M && M.platos || []).filter(function (p) { return p.modelo && !p.oculto && !r.platos[String(p.id)]; });
  }
  function datos(carpeta) {
    return Promise.all([
      Sesion.estadisticas(carpeta, DIAS),
      Sesion.aperturas(carpeta, DIAS).catch(function (e) { console.error(e); return []; }) /* si falta la vista, el resto igual se muestra */
    ]);
  }

  function local(cont, carpeta, M) {
    cont.innerHTML = '<p style="margin-top:20px;color:var(--suave)">Cargando estadísticas…</p>';
    datos(carpeta).then(function (x) {
      var filas = x[0], r = sumar(filas), a = sumarAperturas(x[1]);
      var dias = Object.keys(r.porDia), max = Math.max.apply(null, dias.map(function (d) { return r.porDia[d]; }).concat([1]));
      var platos = platosVistos(r, M).slice(0, 10), maxP = platos.length ? platos[0].d3 + platos[0].ar : 1;
      var h = '<div class="kpis">' + [[r.menu7, 'veces que abrieron el menú (7 días)'], [r.menu, 'veces que abrieron el menú (30 días)'], [r.d3, 'platos vistos en 3D (30 días)'], [r.ar, 'platos vistos sobre la mesa con AR (30 días)']]
        .map(function (k) { return '<div class="kpi"><b>' + num(k[0]) + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>';
      if (!filas.length) h += '<p class="caja" style="margin-top:16px;color:var(--suave)">Todavía no hay visitas registradas. Se cuentan solas cada vez que alguien abre el menú o mira un plato en 3D.</p>';
      else {
        h += '<div class="caja est-caja"><h3>Menú abierto por día</h3><div class="est-barras" role="img" aria-label="Veces que abrieron el menú por día, últimos 30 días">' +
          dias.map(function (d) { var v = r.porDia[d]; return '<div title="' + corta(d) + ': ' + v + '"><i style="height:' + (v ? Math.max(3, v / max * 100) : 0) + '%"></i></div>'; }).join('') +
          '</div><div class="est-eje"><span>' + corta(dias[0]) + '</span><span>Máximo: ' + num(max) + ' en un día</span><span>Hoy</span></div></div>';

        /* horas pico: de 6 de la mañana a 5 de la madrugada, para que la noche quede junta */
        if (a.total) {
          var orden = [], maxH = Math.max.apply(null, a.porHora.concat([1]));
          for (var i = 6; i < 30; i++) orden.push(i % 24);
          h += '<div class="caja est-caja"><h3>Horas pico</h3><p class="est-dato">La hora con más visitas: <b>' + horaPico(a) + '</b></p>' +
            '<div class="est-barras horas" role="img" aria-label="Veces que abrieron el menú según la hora del día">' +
            orden.map(function (hr) { var v = a.porHora[hr]; return '<div title="' + hr + ' h: ' + v + '"><i style="height:' + (v ? Math.max(3, v / maxH * 100) : 0) + '%"></i></div>'; }).join('') +
            '</div><div class="est-eje"><span>6 h</span><span>12 h</span><span>18 h</span><span>0 h</span><span>5 h</span></div></div>';

          /* turistas: cuántos lo vieron en inglés */
          h += '<div class="caja est-caja"><h3>Turistas</h3>' + (M && M.en
            ? '<p class="est-dato"><b>' + pct(a.en, a.total) + ' %</b> de las visitas vieron el menú en inglés (' + num(a.en) + ' de ' + num(a.total) + ').</p>'
            : '<p class="est-dato">Tu menú todavía no tiene inglés. Si cargás la traducción de tus platos (en "Editar" → "Inglés"), a los turistas les aparece sola.</p>') + '</div>';
        }

        h += '<div class="caja est-caja"><h3>Platos más mirados en 3D</h3>' + (platos.length ? platos.map(function (p) {
          return '<div class="est-plato"><span class="n">' + esc(p.nombre) + '</span><span class="v">' + num(p.d3) + ' en 3D' + (p.ar ? ' · ' + num(p.ar) + ' en AR' : '') + '</span>' +
            '<span class="barra-h"><i style="width:' + ((p.d3 + p.ar) / maxP * 100) + '%"></i></span></div>';
        }).join('') : '<p style="color:var(--suave);font-size:.88rem">Todavía nadie abrió un plato en 3D.</p>') + '</div>';

        /* platos con 3D que nadie miró: puede que la foto no llame la atención o que estén muy abajo */
        var nadie = sinMirar(r, M);
        if (nadie.length && r.d3 + r.ar > 0) h += '<div class="caja est-caja"><h3>Platos con 3D que nadie miró</h3>' +
          '<p class="est-dato">' + nadie.map(function (p) { return esc(p.nombre); }).join(' · ') + '</p>' +
          '<p style="color:var(--suave);font-size:.82rem;margin-top:6px">Puede que su foto no llame la atención o que estén muy abajo en el menú.</p></div>';
      }
      h += '<p style="color:var(--suave);font-size:.8rem;margin-top:12px">Últimos 30 días. No se guarda ningún dato de quién mira el menú.</p>';
      cont.innerHTML = h;
    }).catch(function (e) {
      cont.innerHTML = '<p style="margin-top:20px">⚠ No se pudieron leer las estadísticas: ' + esc(e.message) + '</p>';
    });
  }

  function porLocal() {
    return Sesion.estadisticas(null, DIAS).then(function (filas) {
      var grupos = {};
      filas.forEach(function (f) { (grupos[f.carpeta] = grupos[f.carpeta] || []).push(f); });
      var r = {}; Object.keys(grupos).forEach(function (c) { r[c] = sumar(grupos[c]); });
      return r;
    });
  }

  /* resumen del último mes para mandarle al local por WhatsApp (sin datos de nadie, solo números) */
  function resumen(carpeta, M) {
    return datos(carpeta).then(function (x) {
      var r = sumar(x[0]), a = sumarAperturas(x[1]), top = platosVistos(r, M)[0], nombre = (M && M.nombre) || carpeta;
      if (!r.menu && !r.d3 && !r.ar) return null;
      var l = ['¡Hola! Te paso cómo le fue a tu menú de ' + nombre + ' en los últimos 30 días 📊', ''];
      l.push('📱 Abrieron el menú ' + num(r.menu) + (r.menu === 1 ? ' vez' : ' veces'));
      if (r.d3 + r.ar) l.push('🧊 Miraron platos en 3D ' + num(r.d3 + r.ar) + (r.d3 + r.ar === 1 ? ' vez' : ' veces'));
      if (top) l.push('⭐ El plato más mirado: ' + top.nombre);
      if (a.total && horaPico(a)) l.push('⏰ La hora con más visitas: ' + horaPico(a));
      if (a.total && M && M.en && a.en) l.push('🌎 ' + pct(a.en, a.total) + ' % lo vio en inglés');
      l.push('', 'Más detalles en tu panel, en la pestaña "Estadísticas": ' + new URL('../panel/?local=' + encodeURIComponent(carpeta), location.href).href);
      return l.join('\n');
    });
  }

  return { local: local, porLocal: porLocal, resumen: resumen, num: num };
})();
