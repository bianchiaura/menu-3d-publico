# Menú 3D

Menú digital para restaurantes (QR o NFC). Cada plato tiene un botón **Ver en 3D** que abre la cámara del celular y muestra el plato sobre la mesa. El menú es solo para mirar: no hay pedidos.

El 3D de cada plato se genera a partir de **fotos reales del plato**, con un generador propio que corre en el navegador (sin servidor y sin costo).

## Links

- Menú de muestra (el QR original): https://ronkstudio.github.io/menu-3d-publico/
- Cada local: https://ronkstudio.github.io/menu-3d-publico/CARPETA-DEL-LOCAL/
- Administrador: https://ronkstudio.github.io/menu-3d-publico/admin/
- Planes y precios (para mandarle a los locales): https://ronkstudio.github.io/menu-3d-publico/precios/ (los montos se cambian en `CONFIG`, arriba del script de `precios/index.html`)
- Panel de cada local: https://ronkstudio.github.io/menu-3d-publico/panel/ (entra con su mail y contraseña y va solo a su local)

## Cómo está organizado

```
motor/              código común a todos los locales
  menu.js, menu.css   arma el menú a partir del menu.json
  visor3d.js          visor 3D con cámara
  relieve.js          dibuja el plato en 3D a partir de su foto y su mapa de alturas
  generador3d.js      generador foto → 3D (encuadre del plato + IA de profundidad)
  cargar-three.js     carga la librería 3D (three.js)
  github.js           publica cambios en este repositorio desde el administrador
  panel.css, qr.js    estilos de los paneles y generador de QR
admin/              panel del administrador por secciones: Inicio, Locales (con la ficha de cada uno), Cobros, Mensajes, Estadísticas y Ajustes
panel/              panel de cada local (y de "Nuevo local"): platos, fotos, 3D, identidad y datos
brasa-y-grano/      local de muestra: menu.json, fotos (img/), modelos 3D (modelos/) y créditos
plantilla/          base vacía; también se usa para la vista previa de un local nuevo
locales.json        lista de locales del administrador
index.html          la raíz: muestra Brasa & Grano
```

## Cómo se crea el 3D de un plato

1. En el panel, al agregar o editar un plato, se suben de **1 a 5 fotos para el 3D** (o se usa la de portada). Recomendado: 3 (1 de arriba + 2 de costado).
2. En **Crear 3D** se indica qué es cada foto:
   - **De arriba** (obligatoria): se encuadra el plato con la elipse. Si la foto está sacada en ángulo, se achata la elipse con "Inclinación" y el plato queda redondo. Da la forma y el color.
   - **De costado** (opcionales): se ajusta un recuadro de borde a borde del plato y desde la base hasta lo más alto de la comida. Con eso se mide la **altura real** (si hay varias, se promedia).
3. Si no hay fotos de costado, la altura se elige a mano (baja, media, alta o muy alta). Se toca **Generar 3D**.
4. Una IA de profundidad (Depth Anything V2, que corre en el navegador) calcula la forma de la comida en la foto de arriba, y con eso se arma el plato en 3D con la foto real encima.

La primera vez el generador baja unos 25 MB; después tarda unos segundos por plato.

Lo que no aparece en ninguna foto no se puede inventar.

## Crear un local nuevo (administrador)

1. Entrar al administrador con tu mail y contraseña (los de Supabase).
2. Tocar **+ Nuevo local** y completar **Datos e identidad**: nombre, carpeta del link, estado, descripción de identidad, logo, colores, tipografía y contacto.
3. En **Platos**: crear categorías y agregar cada plato con precio, descripción, foto de portada y su 3D.
4. **Vista previa** para ver cómo queda y **Crear y publicar local**. En 1 o 2 minutos el link funciona y el local aparece en el administrador con su QR.
5. En su tarjeta, **👤 Crear usuario**: mail, WhatsApp y contraseña inicial del local. Con **📲 Enviar por WhatsApp** se abre su chat con el mensaje de acceso escrito.

Si es una demo con la marca de un local real, dejar activada la franja "Prototipo para…" y publicarla solo con permiso del local.

## App en el celular y diseño de los paneles

- **El administrador se instala como app:** abrirlo en el celular y tocar **📲 Instalar app** (Android/Chrome) o, en iPhone, Safari → Compartir → **Agregar a pantalla de inicio**. Queda con ícono propio y se abre a pantalla completa. Archivos: `admin/manifest.webmanifest`, `sw-admin.js` y `motor/iconos/`.
- **Diseño y colores a elección:** en los dos paneles, arriba, hay dos selectores: diseño (automático, 🖥 computadora o 📱 celular/tablet) y colores (automáticos, ☀ claro u 🌙 oscuro). Se recuerdan en cada dispositivo (`motor/vista.js`).

## Los paneles hoy

- **Inicio de sesión** (Supabase): vos entrás al administrador; cada local entra a su panel con su mail y contraseña y solo puede tocar su menú. Cada uno cambia su contraseña desde **👤 Mi cuenta**.
- **Publicar** pasa por la función `panel` de Supabase, que guarda el token de GitHub: nunca llega al navegador. Un local publica su `menu.json`, sus fotos y su tarjeta para compartir; la lista de locales y la página de entrada las toca solo el administrador.
- **Estadísticas**: el menú anota cada vez que se abre (una vez por visita) y cada plato que se mira en 3D o en AR. Se ven en la pestaña **Estadísticas** de cada local y en las tarjetas del administrador (últimos 30 días). No cuentan la vista previa ni los navegadores donde alguien inició sesión en un panel. No se guarda nada de quién mira.
- Sin iniciar sesión, el panel de un local funciona en modo muestra: los cambios quedan en ese navegador (**Vista previa** y **Descargar menu.json**).
- **Usuarios de cada local** (en su tarjeta del administrador): se ve el mail del usuario y cuándo entró por última vez. **🔑 Nueva contraseña** le pone otra y arma el mensaje de WhatsApp; **Borrar** le quita el acceso (dos toques). **Eliminar** un local borra también su usuario.
- **Precios en grupo**: en Platos, "💲 Cambiar precios en grupo": se eligen platos (o todos) y suben en pesos, en % o las dos cosas (primero el %, redondeado a $10). Queda como borrador hasta publicar.
- **Mensajes a cada local** (administrador): "📨 Para enviar hoy" junta los avisos de pago (7 días antes o vencidos) y el resumen cada 4 semanas. Abren el WhatsApp del local con el texto escrito. Los datos de cobro van en `PRECIOS.cobro`, en `motor/planes.js`.
- **Bienvenida**: la primera vez que un local entra a su panel ve un mensaje corto de qué puede hacer. Sale una sola vez por usuario (queda anotado en su cuenta).
- **Versiones** (volver a un menú publicado antes) y la **lista de locales** son solo del administrador.
- **Editor de plato**: "+ Agregar plato" y "Editar" abren una pantalla completa con **← Volver**; el botón "atrás" del celular vuelve a la lista.
- **Créditos de las fotos** (`"creditos"` + `"fotosConCredito"` en el menu.json): el link aparece solo mientras quede a la vista alguna foto que no es del local.

## El menu.json

Campos del local: `nombre`, `subtitulo`, `identidad`, `tipografia` (`clasica`, `moderna`, `elegante`, `rustica`), `logo`, `prototipo`, `moneda`, `info` (`direccion`, `horario`, `whatsapp`, `instagram`), `colores` (`claro`/`oscuro` con `acento` y `acento2`), `creditos`, `categorias` y `platos`.

Cada plato: `id`, `categoria`, `nombre`, `descripcion`, `precio`, `emoji`, `foto`, `etiquetas` (`sin-tacc`, `vegano`, `chef` o cualquier texto), `agotado`, `oculto` y `modelo`:

```json
"modelo": { "tipo": "foto", "textura": "modelos/1-textura.jpg", "relieve": "modelos/1-relieve.png", "altura": 0.2 }
```

## Límites conocidos

- El 3D sale de una sola foto: se ve muy bien de frente y en diagonal, pero no tiene "parte de atrás".
- El plato sigue los giros del celular, no los desplazamientos (no hay WebXR).
- Las fotos de Brasa & Grano son de Wikimedia Commons (ver `brasa-y-grano/creditos.html`).

## Mascota del local (opcional)

Un personajito que vive abajo a la izquierda del menú. Al tocarlo salta, dice una frase y recomienda un plato al azar; "Ver plato" lleva a ese plato. El cliente lo puede ocultar. Se activa agregando al `menu.json`:

```json
"mascota": { "nombre": "Brasita", "frases": ["…"], "recomienda": ["Hoy yo pediría {plato}.", "…"] }
```

Brasa & Grano tiene a **Brasita**, una brasa con cara. Código: `motor/mascota.js`.

## AR del celular, idiomas y compartir

- **AR "de verdad"** (`motor/ar.js`): en iPhone (Quick Look) y Android con AR, el visor muestra **"Ver en tu mesa (AR)"**. El plato queda fijo sobre la mesa y en tamaño real aunque uno se mueva. El modelo se convierte en el momento a `.glb` y lo abre `<model-viewer>` (Google). Tamaño: `"diametro"` (cm) en el `modelo` del plato; si no está, 26 cm.
- **Inglés**: con un bloque `"en"` en el `menu.json` (categorías, platos, info y frases de la mascota) aparece el botón **EN/ES**; si el celular no está en español, arranca en inglés. En el panel, cada plato tiene "Inglés (opcional)".
- **Compartir** (`motor/compartir.js`): al publicar, el panel genera `compartir.jpg` (foto + nombre + "Menú con platos en 3D") y la página del local, para que el link se vea con imagen en WhatsApp.
- **Paneles**: los borradores se guardan en IndexedDB (`motor/almacen.js`, sin el límite de 5 MB); avisan si alguien publicó mientras se editaba; se pueden ordenar platos y categorías, borrar categorías y, desde el administrador, eliminar un local (pide escribir su nombre).

## Supabase

En `supabase/` están los archivos del login y las estadísticas: `LEEME.md` (pasos), `1-esquema.sql`, `2-hacerme-admin.sql` y `3-funcion-panel.ts`.

La función `panel` (Edge Function) hace: `mis-locales`, `publicar`, `crear-usuario`, `usuarios`, `nueva-clave` y `borrar-usuario` (estas cuatro, solo el administrador). Su único secreto es `GITHUB_TOKEN`; el proyecto (`ronkstudio/menu-3d-publico`), el autor de los cambios y las direcciones permitidas están escritos en el código. Para cambiarla: Supabase → Edge Functions → panel → Code → pegar el archivo → **Deploy updates**.
