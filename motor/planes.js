/* Menú 3D · planes y precios: lo usan la página de precios (precios/) y el administrador (plan de cada local).
   Para cambiar un monto o una promoción, se cambia acá y queda igual en los dos lados. */
window.PRECIOS = {
  whatsapp: '5491123121409',    /* tu WhatsApp para el botón "Quiero el mío", ej. '5491122334455'. Vacío = no se muestra */
  actualizado: 'noviembre de 2026',
  impuestos: 'Precios en pesos argentinos.',
  mesesGratisAnual: 2,          /* anual: se pagan 12 - 2 = 10 meses */
  planes: [
    { id: 'esencial', nombre: 'Esencial', para: 'Para la mayoría de las cartas', mes: 60000,
      incluye: ['Diseño y armado del menú incluidos', 'Hasta 20 platos en 3D (las bebidas no cuentan)', 'Ver el plato sobre la mesa (AR)', 'QR listos para imprimir', 'Panel para cambiar precios, platos y categorías', 'Estadísticas básicas'],
      no: ['Menú en inglés', 'Resumen mensual por WhatsApp'] },
    { id: 'completo', nombre: 'Completo', para: 'El que eligen la mayoría', mes: 75000, destacado: true,
      incluye: ['Todo lo del Esencial', 'Hasta 40 platos en 3D (las bebidas no cuentan)', 'Menú en inglés para turistas', 'Estadísticas completas: horas pico, turistas y platos más mirados', 'Resumen del mes por WhatsApp'] },
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
/* cómo te pagan: aparece en el aviso de pago que le mandás a cada local. Vacío = el mensaje dice que le pasás los datos por ahí */
window.PRECIOS.cobro = {
  alias: '',                       /* alias de tu cuenta o de Mercado Pago, ej. 'menu3d.pagos' */
  titular: 'Bautista Bianchimani', /* a nombre de quién está la cuenta */
  link: ''                         /* link de pago, si tenés uno (opcional) */
};
