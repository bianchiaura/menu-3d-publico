/* Menú 3D · QR para los paneles. Usa la librería qrcode-generator (se carga antes desde cdnjs). */
window.QR = {
  /* dibujo del QR para mostrar en pantalla */
  svg: function (texto) {
    var q = qrcode(0, 'M'); q.addData(texto); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  },
  /* descarga el QR como imagen PNG grande, lista para imprimir */
  descargar: function (texto, nombre) {
    var q = qrcode(0, 'M'); q.addData(texto); q.make();
    var n = q.getModuleCount(), m = 4, px = Math.floor(1200 / (n + m * 2)), lado = px * (n + m * 2);
    var c = document.createElement('canvas'); c.width = c.height = lado;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, lado, lado); g.fillStyle = '#000';
    for (var f = 0; f < n; f++) for (var k = 0; k < n; k++) if (q.isDark(f, k)) g.fillRect((k + m) * px, (f + m) * px, px, px);
    var a = document.createElement('a'); a.download = (nombre || 'qr') + '.png'; a.href = c.toDataURL('image/png'); a.click();
  }
};
