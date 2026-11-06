/* Menú 3D · inicio de sesión con Supabase (para vos y para cada local).
   Necesita supabase-js cargado antes (window.supabase).
   - Sesion.actual()            → promesa con { email, admin, locales: [...] } o null si no inició sesión
   - Sesion.pedirLogin(opciones) → muestra la pantalla de inicio de sesión; resuelve con lo mismo que actual()
   - Sesion.funcion(accion, {…}) → llama a la función "panel" de Supabase (publicar, crear-usuario, mis-locales)
   - Sesion.estadisticas(carpeta, dias) → resumen de vistas por día, tipo y plato
   - Sesion.cuenta()            → ventana con el mail, cambiar contraseña y cerrar sesión
   - Sesion.bienvenidaVista()   → anota que el local ya vio la bienvenida del panel
   - Sesion.pagos()             → pagos registrados de todos los locales (solo el administrador)
   La URL y la clave publicable son públicas: se pueden ver sin riesgo. */
window.Sesion = (function () {
  'use strict';
  var URL_SB = 'https://nudadncqyagovqzdkbuq.supabase.co';
  var CLAVE = 'sb_publishable_TE00ghT-FzqJTFkT5WwXKA_N_943Wz6';
  var sb = window.supabase.createClient(URL_SB, CLAVE, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'menu3d-sesion' } });
  var datos = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function noContar() { try { localStorage.setItem('menu3d-no-contar', '1'); } catch (e) {} } /* tus propias visitas al menú no suman en las estadísticas */

  function funcion(accion, extra) {
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) throw new Error('Tu sesión se cerró. Recargá la página e iniciá sesión de nuevo.');
      var cuerpo = { accion: accion }; Object.keys(extra || {}).forEach(function (k) { cuerpo[k] = extra[k]; });
      return fetch(URL_SB + '/functions/v1/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CLAVE, Authorization: 'Bearer ' + s.access_token },
        body: JSON.stringify(cuerpo)
      });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        var e;
        if (r.status === 413) e = new Error('Son demasiadas fotos juntas. Publicá de a menos platos nuevos por vez.');
        else if (!r.ok || j.error) e = new Error(j.error || j.msg || j.message || ('Error ' + r.status));
        if (e) { e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function actual() {
    if (datos) return Promise.resolve(datos);
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session; if (!s) return null;
      return funcion('mis-locales').then(function (j) {
        noContar();
        var meta = s.user.user_metadata || {};
        datos = { email: s.user.email, admin: !!j.admin, locales: (j.locales || []).filter(function (c) { return c !== '*'; }), bienvenida: !!meta.bienvenida_vista };
        return datos;
      }, function (e) {
        console.error(e);
        /* sesión vencida o inválida: se cierra y se vuelve a pedir. Si es un corte de internet, NO se cierra la sesión */
        if (e.status === 401) return sb.auth.signOut().then(function () { return null; });
        throw e;
      });
    });
  }

  function entrar(email, password) {
    return sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (r.error) throw new Error(/invalid login/i.test(r.error.message) ? 'Mail o contraseña incorrectos.' : r.error.message);
      datos = null; return actual();
    });
  }
  function salir() { datos = null; return sb.auth.signOut(); }

  /* pantalla de inicio de sesión. opciones: { titulo, texto, sinSesion: 'texto del botón para seguir sin sesión' } */
  function pedirLogin(o) {
    o = o || {};
    return new Promise(function (ok) {
      var d = document.createElement('div'); d.className = 'login';
      d.innerHTML = '<form class="caja form" novalidate>' +
        '<h2>' + esc(o.titulo || 'Iniciar sesión') + '</h2>' +
        '<p class="sub">' + esc(o.texto || 'Entrá con el mail y la contraseña que te dieron.') + '</p>' +
        '<label>Mail<input type="email" name="email" autocomplete="username" required></label>' +
        '<label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>' +
        '<p class="msg" role="alert">' + esc(o.error || '') + '</p>' +
        '<button class="b p">Entrar</button>' +
        (o.sinSesion ? '<button type="button" class="b" data-sin>' + esc(o.sinSesion) + '</button>' : '') +
        '<p class="sub" style="font-size:.8rem">' + esc(o.ayuda || 'Si olvidaste tu contraseña, escribinos y te enviamos una nueva.') + '</p></form>';
      document.body.appendChild(d);
      var f = d.querySelector('form'), msg = d.querySelector('.msg'), bot = f.querySelector('.b.p');
      f.email.focus();
      f.onsubmit = function (e) {
        e.preventDefault();
        var m = f.email.value.trim(), p = f.password.value;
        if (!m || !p) { msg.textContent = 'Completá el mail y la contraseña.'; return; }
        bot.disabled = true; msg.textContent = ''; bot.textContent = 'Entrando…';
        entrar(m, p).then(function (x) {
          if (!x) throw new Error('No se pudo comprobar tu usuario. Probá de nuevo.');
          d.remove(); ok(x);
        }).catch(function (err) { msg.textContent = err.message; bot.disabled = false; bot.textContent = 'Entrar'; });
      };
      var sin = d.querySelector('[data-sin]'); if (sin) sin.onclick = function () { d.remove(); ok(null); };
    });
  }

  /* ventana "Mi cuenta": cambiar contraseña y cerrar sesión */
  function cuenta() {
    var d = document.createElement('dialog'); d.style.maxWidth = '420px';
    d.innerHTML = '<form class="cuerpo form" novalidate><h2 style="font-size:1.15rem">Mi cuenta</h2>' +
      '<p style="color:var(--suave);font-size:.88rem">Entraste como <b>' + esc(datos && datos.email) + '</b></p>' +
      '<label>Contraseña nueva<small>Mínimo 8 caracteres</small><input type="password" name="p1" autocomplete="new-password" minlength="8"></label>' +
      '<label>Repetila<input type="password" name="p2" autocomplete="new-password"></label>' +
      '<p class="msg" style="font-size:.88rem"></p>' +
      '<p style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button type="button" class="b mal" data-salir>Cerrar sesión</button>' +
      '<span style="display:flex;gap:8px"><button type="button" class="b" data-cerrar>Cerrar</button><button class="b p">Cambiar contraseña</button></span></p></form>';
    document.body.appendChild(d);
    var f = d.querySelector('form'), msg = d.querySelector('.msg');
    d.addEventListener('close', function () { d.remove(); });
    d.querySelector('[data-cerrar]').onclick = function () { d.close(); };
    d.querySelector('[data-salir]').onclick = function () { salir().then(function () { location.reload(); }); };
    f.onsubmit = function (e) {
      e.preventDefault();
      var a = f.p1.value, b = f.p2.value;
      msg.style.color = 'var(--mal)';
      if (a.length < 8) { msg.textContent = 'La contraseña tiene que tener al menos 8 caracteres.'; return; }
      if (a !== b) { msg.textContent = 'Las dos contraseñas no coinciden.'; return; }
      msg.style.color = 'var(--suave)'; msg.textContent = 'Guardando…';
      sb.auth.updateUser({ password: a }).then(function (r) {
        if (r.error) throw r.error;
        msg.style.color = 'var(--ok)'; msg.textContent = '✓ Listo: desde ahora entrás con la contraseña nueva.'; f.p1.value = f.p2.value = '';
      }).catch(function (err) { msg.style.color = 'var(--mal)'; msg.textContent = err.message; });
    };
    d.showModal();
  }

  /* resumen de los últimos "dias" días: [{ carpeta, dia, tipo, plato, cantidad }] (carpeta null = todos los locales).
     Supabase devuelve como mucho 1000 filas por pedido: se piden de a tandas hasta traer todo. */
  function estadisticas(carpeta, dias) {
    return consulta('resumen_vistas', 'carpeta,dia,tipo,plato,cantidad', ['carpeta', 'dia', 'tipo', 'plato'], carpeta, dias);
  }
  /* aperturas del menú por día, hora e idioma: [{ carpeta, dia, hora, idioma, cantidad }] (para horas pico y turistas) */
  function aperturas(carpeta, dias) {
    return consulta('resumen_aperturas', 'carpeta,dia,hora,idioma,cantidad', ['carpeta', 'dia', 'hora', 'idioma'], carpeta, dias);
  }
  function consulta(vista, columnas, orden, carpeta, dias) {
    var desde = new Date(Date.now() - (dias - 1) * 864e5).toISOString().slice(0, 10), TANDA = 1000, todo = [];
    function tanda(n) {
      var q = sb.from(vista).select(columnas).gte('dia', desde);
      orden.forEach(function (c) { q = q.order(c, { nullsFirst: true }); });
      q = q.range(n * TANDA, n * TANDA + TANDA - 1);
      if (carpeta) q = q.eq('carpeta', carpeta);
      return q.then(function (r) {
        if (r.error) throw new Error(r.error.message);
        todo = todo.concat(r.data || []);
        return (r.data || []).length === TANDA && n < 50 ? tanda(n + 1) : todo;
      });
    }
    return tanda(0);
  }

  /* plan de cada local (tabla "planes": solo el administrador la ve) → { carpeta: { plan, pago, desde } } */
  function planes() {
    return sb.from('planes').select('*').then(function (r) {
      if (r.error) throw new Error(r.error.message);
      var o = {}; (r.data || []).forEach(function (p) { o[p.carpeta] = p; }); return o;
    });
  }
  /* pagos registrados, del más nuevo al más viejo (tabla "pagos": solo el administrador la ve) */
  function pagos() {
    return sb.from('pagos').select('*').order('id', { ascending: false }).limit(1000).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return r.data || [];
    });
  }
  function guardarPlan(carpeta, p) {
    return sb.from('planes').upsert({ carpeta: carpeta, plan: p.plan, pago: p.pago, desde: p.desde, actualizado: new Date().toISOString() })
      .then(function (r) { if (r.error) throw new Error(r.error.message); });
  }
  /* anota cuándo se mandó el resumen o el aviso de pago (si la columna todavía no existe, no pasa nada) */
  function marcarEnviado(carpeta, campo, fecha) {
    var cambios = {}; cambios[campo] = fecha;
    return sb.from('planes').update(cambios).eq('carpeta', carpeta).then(function (r) { if (r.error) console.error(r.error); });
  }
  function borrarPlan(carpeta) {
    return sb.from('planes').delete().eq('carpeta', carpeta).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }

  /* lista de difusión (tabla "prospectos": solo el administrador la ve) */
  function prospectos() {
    var TANDA = 1000, todo = [];
    function tanda(n) {
      return sb.from('prospectos').select('*').order('barrio').order('nombre').range(n * TANDA, n * TANDA + TANDA - 1).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        todo = todo.concat(r.data || []);
        return (r.data || []).length === TANDA ? tanda(n + 1) : todo;
      });
    }
    return tanda(0);
  }
  function guardarProspecto(id, cambios) {
    return sb.from('prospectos').update(cambios).eq('id', id).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }
  function agregarProspecto(p) {
    return sb.from('prospectos').insert(p).select().single().then(function (r) { if (r.error) throw new Error(r.error.message); return r.data; });
  }

  /* la bienvenida del panel se muestra una sola vez por usuario (queda anotado en su cuenta, sirve en cualquier celular) */
  function bienvenidaVista() {
    if (datos) datos.bienvenida = true;
    return sb.auth.updateUser({ data: { bienvenida_vista: true } }).catch(function (e) { console.error(e); });
  }

  /* contraseña inicial fácil de dictar (sin letras que se confunden: l, 1, o, 0) */
  function claveNueva() {
    var abc = 'abcdefghjkmnpqrstuvwxyz23456789', n = new Uint32Array(10), s = '';
    crypto.getRandomValues(n); for (var i = 0; i < n.length; i++) s += abc[n[i] % abc.length];
    return s.slice(0, 5) + '-' + s.slice(5);
  }

  return { actual: actual, entrar: entrar, salir: salir, pedirLogin: pedirLogin, funcion: funcion, estadisticas: estadisticas, aperturas: aperturas, cuenta: cuenta, claveNueva: claveNueva, bienvenidaVista: bienvenidaVista, planes: planes, pagos: pagos, prospectos: prospectos, guardarProspecto: guardarProspecto, agregarProspecto: agregarProspecto, guardarPlan: guardarPlan, borrarPlan: borrarPlan, marcarEnviado: marcarEnviado };
})();
