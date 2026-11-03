# Menú 3D

Menú digital para restaurantes (QR o NFC). Cada plato tiene un botón **Ver en 3D** que abre la cámara del celular y muestra el plato sobre la mesa. El menú es solo para mirar: no hay pedidos.

El 3D de cada plato se genera a partir de **fotos reales del plato**, con un generador propio que corre en el navegador (sin servidor y sin costo).

## Links

- Menú de muestra (el QR original): https://bianchiaura.github.io/menu-3d-publico/
- Cada local: https://bianchiaura.github.io/menu-3d-publico/CARPETA-DEL-LOCAL/
- Administrador: https://bianchiaura.github.io/menu-3d-publico/admin/
- Panel de un local: https://bianchiaura.github.io/menu-3d-publico/panel/?local=CARPETA-DEL-LOCAL

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
admin/              panel del administrador: locales, links, QR, "Nuevo local" y conexión con GitHub
panel/              panel de cada local (y de "Nuevo local"): platos, fotos, 3D, identidad y datos
brasa-y-grano/      local de muestra: menu.json, fotos (img/), modelos 3D (modelos/) y créditos
plantilla/          base vacía; también se usa para la vista previa de un local nuevo
locales.json        lista de locales del administrador
index.html          la raíz: muestra Brasa & Grano
```

## Cómo se crea el 3D de un plato

1. En el panel, al agregar o editar un plato, se suben 1 a 4 **fotos para el 3D** (o se usa la de portada).
2. En **Crear 3D** se elige la mejor foto y se encuadra el plato con la elipse. Si la foto está sacada en ángulo, se achata la elipse con "Inclinación" y el plato queda redondo.
3. Se elige el **volumen** (bajo para pizzas, medio para carnes y pastas, alto para hamburguesas y postres altos) y se toca **Generar 3D**.
4. Una IA de profundidad (Depth Anything V2, que corre en el navegador) calcula la altura de cada punto de la comida, y con eso se arma el plato en 3D con la foto real encima.

La primera vez el generador baja unos 25 MB; después tarda unos segundos por plato.

**Fotos que mejor funcionan:** el plato entero, desde arriba o en diagonal (no de costado), con buena luz y sin cosas encima. El 3D se ve muy real de frente y en diagonal; de costado total, lo que no se ve en la foto no se puede inventar.

## Crear un local nuevo (administrador)

1. En el administrador, conectar GitHub una sola vez (abajo de todo están los pasos para crear el token).
2. Tocar **+ Nuevo local** y completar **Datos e identidad**: nombre, carpeta del link, estado, descripción de identidad, logo, colores, tipografía y contacto.
3. En **Platos**: crear categorías y agregar cada plato con precio, descripción, foto de portada y su 3D.
4. **Vista previa** para ver cómo queda y **Crear y publicar local**. En 1 o 2 minutos el link funciona y el local aparece en el administrador con su QR.

Si es una demo con la marca de un local real, dejar activada la franja "Prototipo para…" y publicarla solo con permiso del local.

## Los paneles hoy

- Con GitHub conectado (administrador), **Publicar** sube los cambios directo.
- Sin conexión (un local), los cambios quedan en su navegador: **Vista previa** los muestra y **Descargar menu.json** genera el archivo para mandárselo al administrador.
- Próximo paso: login para cada local con Supabase, para que publiquen solos sin tocar GitHub.

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
