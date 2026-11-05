/* Menú 3D · estadísticas en los paneles (lee de Supabase con sesion.js).
   - Estadisticas.local(contenedor, carpeta, menu): pestaña "Estadísticas" del panel de un local
   - Estadisticas.porLocal(dias): { carpeta: { menu, menu7, d3, ar } } para el panel del administrador
   Las visitas las anota el menú público (motor/menu.js y visor3d.js) en la tabla "vistas". */
window.Estadisticas = (function () {
  'use strict';
  var DIAS = 30;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fecha(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function ultimosDias(n) { var l = [], h = new Date(); for (var i = n - 1; i >= 0; i--) l.push(fecha(new Date(h.getFullYear(), h.getMonth(), h.getDate() - i))); return l; }
  function num(n) { return Number(n).toLocaleString('es-AR'); }
  function corta(dia) { var p = dia.split('-'); return Number(p[2]) + '/' + Number(p[1]); }

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

  function local(cont, carpeta, M) {
    cont.innerHTML = '<p style="margin-top:20px;color:var(--suave)">Cargando estadísticas…</p>';
    Sesion.estadisticas(carpeta, DIAS).then(function (filas) {
      var r = sumar(filas), dias = Object.keys(r.porDia), max = Math.max.apply(null, dias.map(function (d) { return r.porDia[d]; }).concat([1]));
      var platos = Object.keys(r.platos).map(function (id) {
        var p = (M && M.platos || []).filter(function (x) { return String(x.id) === id; })[0];
        return { nombre: p ? p.nombre : 'Plato borrado', d3: r.platos[id].d3, ar: r.platos[id].ar };
      }).sort(function (a, b) { return (b.d3 + b.ar) - (a.d3 + a.ar); }).slice(0, 10);
      var maxP = platos.length ? platos[0].d3 + platos[0].ar : 1;
      var h = '<div class="kpis">' + [[r.menu7, 'veces que abrieron el menú (7 días)'], [r.menu, 'veces que abrieron el menú (30 días)'], [r.d3, 'platos vistos en 3D (30 días)'], [r.ar, 'platos vistos sobre la mesa con AR (30 días)']]
        .map(function (k) { return '<div class="kpi"><b>' + num(k[0]) + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>';
      if (!filas.length) h += '<p class="caja" style="margin-top:16px;color:var(--suave)">Todavía no hay visitas registradas. Se cuentan solas cada vez que alguien abre el menú o mira un plato en 3D.</p>';
      else {
        h += '<div class="caja est-caja"><h3>Menú abierto por día</h3><div class="est-barras" role="img" aria-label="Veces que abrieron el menú por día, últimos 30 días">' +
          dias.map(function (d) { var v = r.porDia[d]; return '<div title="' + corta(d) + ': ' + v + '"><i style="height:' + (v ? Math.max(3, v / max * 100) : 0) + '%"></i></div>'; }).join('') +
          '</div><div class="est-eje"><span>' + corta(dias[0]) + '</span><span>Máximo: ' + num(max) + ' en un día</span><span>Hoy</span></div></div>';
        h += '<div class="caja est-caja"><h3>Platos más mirados en 3D</h3>' + (platos.length ? platos.map(function (p) {
          return '<div class="est-plato"><span class="n">' + esc(p.nombre) + '</span><span class="v">' + num(p.d3) + ' en 3D' + (p.ar ? ' · ' + num(p.ar) + ' en AR' : '') + '</span>' +
            '<span class="barra-h"><i style="width:' + ((p.d3 + p.ar) / maxP * 100) + '%"></i></span></div>';
        }).join('') : '<p style="color:var(--suave);font-size:.88rem">Todavía nadie abrió un plato en 3D.</p>') + '</div>';
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

  return { local: local, porLocal: porLocal, num: num };
})();
