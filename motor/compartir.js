/* Menú 3D · imagen que aparece al compartir el link del menú (WhatsApp, Instagram, etc.).
   Compartir.tarjeta(menu, base) arma una imagen de 1200x630 con la foto de un plato, el nombre del local
   y "Menú con platos en 3D", y devuelve una promesa con la imagen (data URL JPEG).
   El panel la genera sola al publicar y la guarda como compartir.jpg en la carpeta del local. */
window.Compartir = (function () {
  'use strict';
  var W = 1200, H = 630;
  function imagen(src) {
    return new Promise(function (ok) {
      if (!src) { ok(null); return; }
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src;
    });
  }
  function ruta(r, base) { return !r ? '' : /^(https?:|data:|blob:|\/)/.test(r) ? r : (base || '') + r; }
  /* la foto de portada: primero un plato recomendado por el chef, si no el primero con foto */
  function platoFoto(M) {
    var con = M.platos.filter(function (p) { return p.foto && !p.oculto; });
    return con.filter(function (p) { return (p.etiquetas || []).indexOf('chef') >= 0; })[0] || con[0];
  }
  function cubrir(g, im, x, y, w, h) {
    var k = Math.max(w / im.width, h / im.height), sw = w / k, sh = h / k;
    g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  }
  function lineas(g, texto, ancho) {
    var pal = String(texto).split(' '), l = [], act = '';
    pal.forEach(function (p) { var t = act ? act + ' ' + p : p; if (g.measureText(t).width > ancho && act) { l.push(act); act = p; } else act = t; });
    if (act) l.push(act);
    return l;
  }
  function tarjeta(M, base) {
    var p = platoFoto(M), acento = (M.colores && M.colores.claro && M.colores.claro.acento) || '#b5832f';
    var fuentes = document.fonts ? Promise.all(['700 64px Fraunces', '500 28px "DM Sans"', '700 26px "DM Sans"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    return Promise.all([imagen(p && ruta(p.foto, base)), imagen(ruta(M.logo, base)), fuentes]).then(function (r) {
      var foto = r[0], logo = r[1], c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d');
      /* fondo oscuro con el color del local */
      g.fillStyle = '#1b140f'; g.fillRect(0, 0, W, H);
      var gr = g.createLinearGradient(560, 0, W, H); gr.addColorStop(0, acento); gr.addColorStop(1, '#1b140f');
      g.globalAlpha = .55; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      /* foto del plato a la izquierda, con borde diagonal */
      if (foto) {
        g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(640, 0); g.lineTo(540, H); g.lineTo(0, H); g.closePath(); g.clip();
        cubrir(g, foto, 0, 0, 640, H); g.restore();
        g.strokeStyle = acento; g.lineWidth = 8; g.beginPath(); g.moveTo(640, 0); g.lineTo(540, H); g.stroke();
      }
      var x = foto ? 610 : 90, ancho = W - x - 70, y = 190;
      if (logo) { g.save(); g.beginPath(); g.arc(W - 110, 110, 54, 0, Math.PI * 2); g.clip(); cubrir(g, logo, W - 164, 56, 108, 108); g.restore(); }
      /* nombre del local (en una o dos líneas) */
      g.fillStyle = '#fff'; g.font = '700 68px Fraunces, Georgia, serif';
      var ln = lineas(g, M.nombre || 'Menú', ancho);
      if (ln.length > 2) { g.font = '700 52px Fraunces, Georgia, serif'; ln = lineas(g, M.nombre, ancho).slice(0, 3); }
      ln.forEach(function (t) { g.fillText(t, x, y); y += 76; });
      /* etiqueta "Menú con platos en 3D" */
      y += 18; g.font = '700 26px "DM Sans", system-ui, sans-serif';
      var et = 'Menú con platos en 3D', ew = g.measureText(et).width + 44;
      g.fillStyle = acento; g.beginPath(); g.roundRect(x, y, ew, 50, 25); g.fill();
      g.fillStyle = '#fff'; g.fillText(et, x + 22, y + 34);
      g.font = '500 28px "DM Sans", system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)';
      lineas(g, 'Mirá cada plato sobre tu mesa antes de pedir', ancho).forEach(function (t, i) { g.fillText(t, x, y + 104 + i * 38); });
      return c.toDataURL('image/jpeg', .86);
    });
  }
  return { tarjeta: tarjeta };
})();
