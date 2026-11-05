/* Menú 3D · QR para los paneles. Usa la librería qrcode-generator (se carga antes desde cdnjs).
   - QR.svg(texto): dibujo chico para mostrar en pantalla
   - QR.png(texto, nombre): imagen grande (PNG) lista para imprimir, con el nombre del local abajo
   - QR.mostrar(texto, nombre, archivo): ventana con el QR grande y los botones para guardarlo o compartirlo.
     En el celular, "Compartir / Guardar" abre el menú del sistema (Guardar imagen, WhatsApp, Imprimir…);
     la descarga directa no funciona en muchos celulares ni en la app instalada. */
window.QR = (function () {
  'use strict';
  function codigo(texto) { var q = qrcode(0, 'M'); q.addData(texto); q.make(); return q; }

  function svg(texto) { return codigo(texto).createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }

  function png(texto, nombre) {
    var q = codigo(texto), n = q.getModuleCount(), m = 4, px = Math.floor(1200 / (n + m * 2)), lado = px * (n + m * 2);
    var abajo = nombre ? Math.round(lado * 0.2) : 0;
    var c = document.createElement('canvas'); c.width = lado; c.height = lado + abajo;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (var f = 0; f < n; f++) for (var k = 0; k < n; k++) if (q.isDark(f, k)) g.fillRect((k + m) * px, (f + m) * px, px, px);
    if (nombre) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      var t = Math.round(abajo * 0.38); g.font = '700 ' + t + 'px Georgia, serif';
      while (g.measureText(nombre).width > lado * 0.9 && t > 20) { t -= 4; g.font = '700 ' + t + 'px Georgia, serif'; }
      g.fillText(nombre, lado / 2, lado - px * 1.5 + abajo * 0.32);
      g.fillStyle = '#555'; g.font = Math.round(abajo * 0.2) + 'px Arial, sans-serif';
      g.fillText('Escaneá y mirá los platos en 3D', lado / 2, lado - px * 1.5 + abajo * 0.72);
    }
    return c.toDataURL('image/png');
  }

  function mostrar(texto, nombre, archivo) {
    var img = png(texto, nombre), nom = (archivo || 'qr') + '.png';
    var d = document.createElement('dialog'); d.className = 'qr-grande'; d.style.maxWidth = '440px';
    d.innerHTML = '<div class="cuerpo" style="display:grid;gap:12px;text-align:center">' +
      '<h2 style="font-size:1.15rem">QR del menú</h2>' +
      '<img alt="" style="width:100%;max-width:340px;margin:0 auto;border-radius:12px;border:1px solid var(--linea);background:#fff">' +
      '<p style="color:var(--suave);font-size:.85rem">Para imprimir y poner en las mesas. En el celular también podés mantener apretada la imagen para guardarla.</p>' +
      '<p class="msg" style="font-size:.85rem;color:var(--mal)"></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
      '<button type="button" class="b p" data-compartir>📲 Compartir / Guardar</button>' +
      '<a class="b" data-bajar>⬇ Descargar</a>' +
      '<button type="button" class="b" data-cerrar>Cerrar</button></div></div>';
    d.querySelector('img').src = img; d.querySelector('img').alt = 'QR del menú de ' + (nombre || '');
    var bajar = d.querySelector('[data-bajar]'); bajar.href = img; bajar.download = nom;
    var msg = d.querySelector('.msg'), compartir = d.querySelector('[data-compartir]');
    compartir.onclick = function () {
      fetch(img).then(function (r) { return r.blob(); }).then(function (b) {
        var f = new File([b], nom, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'QR del menú' + (nombre ? ' de ' + nombre : '') });
        bajar.click(); /* en la compu: se descarga */
      }).catch(function (e) { if (e && e.name !== 'AbortError') msg.textContent = 'No se pudo compartir. Mantené apretada la imagen para guardarla.'; });
    };
    d.querySelector('[data-cerrar]').onclick = function () { d.close(); };
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); /* tocar afuera cierra */
    document.body.appendChild(d); d.showModal();
  }

  /* compatibilidad: antes "Descargar QR" llamaba a esto */
  function descargar(texto, nombre) { mostrar(texto, null, nombre); }

  return { svg: svg, png: png, mostrar: mostrar, descargar: descargar };
})();
