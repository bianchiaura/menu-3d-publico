# Menú 3D

Menú digital para restaurantes (QR o NFC). Cada plato tiene un botón **Ver en 3D** que abre la cámara del celular y muestra el plato sobre la mesa. El menú es solo para mirar: no hay pedidos.

## Cómo está organizado

```
motor/            código común a todos los locales (no hace falta tocarlo para sumar un local)
  menu.js         arma el menú a partir del menu.json
  menu.css        estilos del menú
  visor3d.js      visor 3D con cámara
  modelos.js      biblioteca de modelos 3D
  panel.css       estilos de los paneles
  qr.js           genera y descarga los QR
admin/            panel del administrador: todos los locales, links, QR y modelos
panel/            panel de cada local: editar platos, precios, stock y datos
brasa-y-grano/    un local: su index.html, su menu.json y sus imágenes
plantilla/        carpeta modelo para copiar al sumar un local nuevo
locales.json      lista de locales que muestra el panel del administrador
index.html        la raíz: muestra Brasa & Grano (el QR original apunta acá)
```

Links:
- Raíz: https://bianchiaura.github.io/menu-3d-publico/
- Cada local: https://bianchiaura.github.io/menu-3d-publico/NOMBRE-DE-LA-CARPETA/
- Administrador: https://bianchiaura.github.io/menu-3d-publico/admin/
- Panel de un local: https://bianchiaura.github.io/menu-3d-publico/panel/?local=NOMBRE-DE-LA-CARPETA

## Los paneles (versión de muestra)

Todavía no piden usuario y contraseña, así que no hay que poner datos privados.
- **Administrador**: lista los locales de `locales.json` con su link, su QR (descargable para imprimir) y cuántos platos tienen en 3D.
- **Local**: permite cambiar precios, marcar "sin stock", ocultar platos, editar o agregar platos (con foto y modelo 3D) y cambiar los datos y colores del local. Los cambios quedan en ese navegador: **Vista previa** muestra el menú con los cambios, y **Descargar menu.json** genera el archivo para subirlo a la carpeta del local.

## Cómo sumar un local

1. Copiar la carpeta `plantilla` y ponerle el nombre del local en minúsculas y con guiones (ej. `la-esquina`). Ese nombre va en el link.
2. En `index.html` de la carpeta nueva, cambiar `NOMBRE DEL LOCAL` (aparece 2 veces): es lo que se ve al compartir el link.
3. Completar `menu.json` (ver abajo). Las fotos y el logo van en la misma carpeta (por ejemplo en `img/`).
4. Si es una demo con la marca de un local real, dejar `"prototipo": true` y publicarla solo con permiso del local.

## El menu.json

| Campo | Qué es |
|---|---|
| `nombre` | Nombre del local |
| `subtitulo` | Texto chico debajo del nombre |
| `logo` | Ruta del logo, ej. `img/logo.png` (vacío = sin logo) |
| `prototipo` | `true` muestra arriba la franja "Prototipo para [nombre]" |
| `moneda` | Símbolo del precio, ej. `$` |
| `info` | `direccion`, `horario`, `whatsapp` (con código de país) e `instagram`: se muestran al pie del menú si están completos |
| `colores` | `claro` y `oscuro`: `acento` (botones) y `acento2` (etiquetas). También se pueden pisar `fondo`, `tarjeta`, `texto`, `suave`, `linea` |
| `categorias` | Lista con `id` (sin espacios), `nombre` y `fondo` (color o degradé de la foto) |
| `platos` | Lista de platos (ver abajo) |

Cada plato: `id` (número único), `categoria` (el `id` de su categoría), `nombre`, `descripcion`, `precio` (número sin puntos), `emoji` (se ve si no hay foto), `foto` (ruta, ej. `img/bife.jpg`), `etiquetas` y `modelo`.

- **Etiquetas**: `sin-tacc`, `vegano` y `chef` tienen texto y color propios. Cualquier otra palabra se muestra tal cual.
- **Modelo 3D**: nombre de un modelo de la biblioteca. Si se deja vacío (`""`), el plato no tiene botón "Ver en 3D".
- **Opcionales**: `"agotado": true` muestra "Sin stock hoy"; `"oculto": true` lo saca del menú sin borrarlo.

El menú también trae filtros "Sin TACC" y "Vegano" (aparecen solos si hay platos con esas etiquetas) y baja el visor 3D por adelantado para que "Ver en 3D" abra más rápido.

Modelos disponibles: `bife-de-chorizo`, `ojo-de-bife`, `entrana`, `ravioles`, `sorrentinos`, `hamburguesa`, `hamburguesa-veggie`, `cappuccino`, `medialunas`, `limonada`, `cerveza`, `flan`, `brownie`.

## Límites conocidos

- Los modelos están hechos con código, no son escaneos reales. Los modelos escaneados (.glb) todavía no están soportados.
- El plato sigue los giros del celular, no los desplazamientos (no hay WebXR).
