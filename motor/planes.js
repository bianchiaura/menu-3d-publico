/* Menú 3D · planes y precios: lo usan la página de precios (precios/) y el administrador (plan de cada local).
   Para cambiar un monto o una promoción, se cambia acá y queda igual en los dos lados. */
window.PRECIOS = {
  whatsapp: '5491123121409',    /* tu WhatsApp para el botón "Quiero el mío", ej. '5491122334455'. Vacío = no se muestra */
  actualizado: 'noviembre de 2026',
  impuestos: 'Precios en pesos argentinos.',
  alta: 120000, platoExtra: 8000, platosEnAlta: 10,
  mesesGratisAnual: 2,          /* anual: se pagan 12 - 2 = 10 meses */
  descuentoLanzamiento: 30, cuposLanzamiento: 5,
  planes: [
    { id: 'esencial', nombre: 'Esencial', para: 'Para empezar con lo justo', mes: 35000,
      incluye: ['Menú digital con fotos y QR', 'Hasta 5 platos en 3D', 'Ver el plato sobre la mesa (AR)', 'Panel para cambiar precios y platos', 'Estadísticas básicas'],
      no: ['Menú en inglés', 'Resumen mensual por WhatsApp'] },
    { id: 'completo', nombre: 'Completo', para: 'El que eligen la mayoría', mes: 55000, destacado: true,
      incluye: ['Todo lo del Esencial', 'Hasta 20 platos en 3D', 'Menú en inglés para turistas', 'Estadísticas completas: horas pico, turistas y platos más mirados', 'Resumen del mes por WhatsApp'] },
    { id: 'premium', nombre: 'Premium', para: 'Para cartas grandes o varias sucursales', mes: 85000,
      incluye: ['Todo lo del Completo', 'Platos en 3D sin límite', 'Varias sucursales', 'Atención prioritaria'] }
  ]
};
/* cuántos meses se cobran en cada forma de pago y cuánto dura (en meses) */
window.PRECIOS.formas = {
  mensual: { nombre: 'Mensual', cobra: 1, dura: 1 },
  semestral: { nombre: '6 meses', cobra: 5, dura: 6 },
  anual: { nombre: 'Anual', cobra: 12 - window.PRECIOS.mesesGratisAnual, dura: 12 }
};
