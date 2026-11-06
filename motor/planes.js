/* Menú 3D · planes y precios: lo usan la página de precios (precios/) y el administrador (plan de cada local).
   Para cambiar un monto o una promoción, se cambia acá y queda igual en los dos lados. */
window.PRECIOS = {
  whatsapp: '5491123121409',    /* tu WhatsApp para el botón "Quiero el mío", ej. '5491122334455'. Vacío = no se muestra */
  actualizado: 'noviembre de 2026',
  impuestos: 'Precios en pesos argentinos.',
  mesesGratisAnual: 2,          /* anual: se pagan 12 - 2 = 10 meses */
  planes: [
    { id: 'esencial', nombre: 'Esencial', para: 'Para sumar el 3D a tu carta', mes: 60000,
      funciones: { platos3d: 20, ingles: false, mascota: false, estadisticas: 'basicas', resumen: false, pedidos: false },
      incluye: ['Diseño y carga del menú incluidos', 'Hasta 20 platos en 3D (sin contar bebidas)', 'Platos sobre la mesa con realidad aumentada', 'Códigos QR listos para imprimir', 'Panel propio para gestionar precios, platos, categorías y promociones', 'Estadísticas básicas: visitas y platos vistos'],
      no: ['Menú en inglés', 'Mascota del local', 'Reservas y pedidos por WhatsApp', 'Estadísticas completas', 'Resumen mensual por WhatsApp'] },
    { id: 'completo', nombre: 'Completo', para: 'Para destacarte y entender qué buscan tus clientes', mes: 75000, destacado: true,
      funciones: { platos3d: 40, ingles: true, mascota: true, estadisticas: 'completas', resumen: false, pedidos: true },
      incluye: ['Todo lo del plan Esencial', 'Hasta 40 platos en 3D (sin contar bebidas)', 'Menú en inglés para turistas', 'Mascota que recomienda platos de tu carta', 'Reservas y pedidos por WhatsApp desde el menú', 'Estadísticas completas: horas pico, turistas y platos más vistos'],
      no: ['Resumen mensual por WhatsApp'] },
    { id: 'premium', nombre: 'Premium', para: 'Para cartas extensas, cadenas y varias sucursales', mes: 85000,
      funciones: { platos3d: 0, ingles: true, mascota: true, estadisticas: 'completas', resumen: true, pedidos: true }, /* platos3d: 0 = sin límite */
      incluye: ['Todo lo del plan Completo', 'Platos en 3D sin límite', 'Un menú por sucursal, cada uno con su QR', 'Mascota a medida, con la personalidad de tu marca', 'Resumen mensual por WhatsApp', 'Atención prioritaria por WhatsApp'] }
  ]
};
/* cuántos meses se cobran en cada forma de pago y cuánto dura (en meses) */
window.PRECIOS.formas = {
  mensual: { nombre: 'Mensual', cobra: 1, dura: 1 },
  semestral: { nombre: '6 meses', cobra: 5, dura: 6 },
  anual: { nombre: 'Anual', cobra: 12 - window.PRECIOS.mesesGratisAnual, dura: 12 }
};
/* cómo te pagan: aparece en el aviso de pago que le mandás a cada local. Vacío = el mensaje dice que le pasás los datos por ahí */
window.PRECIOS.cobro = {
  alias: '',                       /* alias de tu cuenta o de Mercado Pago, ej. 'menu3d.pagos' */
  titular: 'Bautista Bianchimani', /* a nombre de quién está la cuenta */
  link: ''                         /* link de pago, si tenés uno (opcional) */
};
/* qué habilita cada plan. Se guarda en el menu.json como "incluye" y lo usan el menú, el panel y el administrador */
window.PRECIOS.funcionesDe = function (id) {
  var p = window.PRECIOS.planes.filter(function (x) { return x.id === id; })[0];
  return p ? JSON.parse(JSON.stringify(p.funciones)) : null;
};
/* mascota con la que arranca un local cuyo plan la incluye */
window.PRECIOS.mascotaBase = function (nombre) {
  var n = String(nombre || '').trim();
  return {
    nombre: n,
    frases: [(n ? '¡Hola! Soy ' + n + '.' : '¡Hola!') + ' Estoy acá para ayudarte a elegir.', 'Tocá "Ver en 3D" y mirá el plato sobre tu mesa.'],
    recomienda: ['Hoy te recomiendo {plato}.', '¿No sabés qué pedir? Probá {plato}.']
  };
};
/* el límite de platos en 3D no cuenta las categorías de bebidas */
window.PRECIOS.esBebida = function (c) { return !!c && /bebida|trago|c[oó]ctel|vino|cerveza/i.test((c.nombre || '') + ' ' + (c.id || '')); };
