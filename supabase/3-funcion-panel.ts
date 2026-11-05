// Menú 3D · función "panel" de Supabase (Edge Function).
// Hace de intermediario seguro: el panel de cada local manda sus cambios acá con su usuario,
// y esta función los publica en GitHub con TU token, que queda guardado en Supabase (nunca llega al local).
//
// Acciones (POST con JSON, siempre con la sesión del usuario):
//   { accion: "mis-locales" }                                   → qué locales puede editar
//   { accion: "publicar", carpeta, archivos: [...], mensaje }    → publica cambios de un local
//   { accion: "crear-usuario", email, password, carpeta }        → (solo admin) crea el usuario de un local
//
// Secreto que hay que cargar en Supabase (Edge Functions → Secrets):
//   GITHUB_TOKEN   token de GitHub con "Contents: Read and write" sobre menu-3d-publico
// El proyecto y el autor de los cambios no son secretos: están acá abajo (si cambia el usuario de GitHub, se cambian acá).

import { createClient } from 'npm:@supabase/supabase-js@2';

const ORIGENES = ['https://ronkstudio.github.io', 'http://localhost:8765'];
const REPO = 'ronkstudio/menu-3d-publico';
const AUTOR = { name: 'ronkstudio', email: '351777670+ronkstudio@users.noreply.github.com' };
const RAMA = 'main';
const API = 'https://api.github.com/repos/' + REPO;
const MAX_ARCHIVOS = 40, MAX_BYTES = 20 * 1024 * 1024;

function cors(req: Request) {
  const o = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGENES.includes(o) ? o : ORIGENES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
function responder(req: Request, cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors(req), 'Content-Type': 'application/json' } });
}

async function github(ruta: string, opciones: { method?: string; body?: unknown } = {}) {
  const r = await fetch(API + ruta, {
    method: opciones.method ?? 'GET',
    headers: { Authorization: 'Bearer ' + Deno.env.get('GITHUB_TOKEN'), Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  if (!r.ok) throw new Error('GitHub ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
function base64Texto(s: string) {
  const b = new TextEncoder().encode(s);
  let t = ''; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(t);
}

type Archivo = { ruta: string; texto?: string; dataUrl?: string; borrar?: boolean };

/* página de entrada del local (la que lee WhatsApp al compartir el link: título e imagen).
   Cuando publica un local, se arma acá a partir de su menú, así queda al día aunque cambie el nombre.
   Es la misma que arma el panel del administrador (paginaLocal en panel/index.html). */
const SITIO = 'https://' + REPO.split('/')[0] + '.github.io/' + REPO.split('/')[1] + '/';
function esc(s: unknown) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]); }
function paginaLocal(m: { nombre?: string; colores?: { claro?: { acento?: string } } }, dir: string) {
  const n = esc(m.nombre), url = SITIO + dir + '/', v = Date.now().toString(36);
  const acento = m.colores?.claro?.acento ?? '', color = /^#[0-9a-f]{3,8}$/i.test(acento) ? acento : '#b5832f';
  const js = (f: string) => '<script src="../motor/' + f + '"></' + 'script>\n';
  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<!-- Datos para cuando se comparte el link (WhatsApp, etc.). El menú en sí está en menu.json. Esta página se genera al publicar -->\n' +
    '<title>' + n + ' · Menú 3D</title>\n<meta name="description" content="Menú digital con platos en 3D. Escaneá el QR o acercá el celular al NFC y mirá cada plato sobre tu mesa.">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta property="og:title" content="' + n + ' · Menú 3D">\n<meta property="og:description" content="Mirá cada plato en 3D sobre tu mesa antes de elegir.">\n' +
    '<meta property="og:image" content="' + esc(url + 'compartir.jpg?v=' + v) + '">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="theme-color" content="' + color + '">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E%F0%9F%8D%BD%3C/text%3E%3C/svg%3E">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="../motor/menu.css">\n</head>\n<body data-menu="menu.json">\n' +
    js('menu.js') + js('cargar-three.js') + js('relieve.js') + js('visor3d.js') + js('mascota.js') + '</body>\n</html>\n';
}

/* publica varios archivos en un solo cambio (commit) */
async function publicar(archivos: Archivo[], mensaje: string) {
  const ref = await github('/git/ref/heads/' + RAMA);
  const padre = ref.object.sha;
  const commit = await github('/git/commits/' + padre);
  const arbol = [];
  for (const a of archivos) {
    if (a.borrar) { arbol.push({ path: a.ruta, mode: '100644', type: 'blob', sha: null }); continue; }
    const contenido = a.dataUrl ? a.dataUrl.split(',')[1] : base64Texto(a.texto ?? '');
    const b = await github('/git/blobs', { method: 'POST', body: { content: contenido, encoding: 'base64' } });
    arbol.push({ path: a.ruta, mode: '100644', type: 'blob', sha: b.sha });
  }
  const nuevoArbol = await github('/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: arbol } });
  const nuevo = await github('/git/commits', { method: 'POST', body: { message: mensaje, tree: nuevoArbol.sha, parents: [padre], author: AUTOR, committer: AUTOR } });
  await github('/git/refs/heads/' + RAMA, { method: 'PATCH', body: { sha: nuevo.sha } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const sesion = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: { user } } = await sesion.auth.getUser();
    if (!user) return responder(req, { error: 'Tenés que iniciar sesión.' }, 401);

    const servidor = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: permisos } = await servidor.from('usuarios_locales').select('carpeta, rol').eq('user_id', user.id);
    const esAdmin = (permisos ?? []).some((p) => p.rol === 'admin');
    const cuerpo = await req.json();

    if (cuerpo.accion === 'mis-locales') return responder(req, { admin: esAdmin, locales: (permisos ?? []).map((p) => p.carpeta) });

    if (cuerpo.accion === 'publicar') {
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(carpeta)) return responder(req, { error: 'Carpeta inválida.' }, 400);
      if (!esAdmin && !(permisos ?? []).some((p) => p.carpeta === carpeta)) return responder(req, { error: 'No tenés permiso para este local.' }, 403);
      const archivos: Archivo[] = Array.isArray(cuerpo.archivos) ? cuerpo.archivos : [];
      if (!archivos.length || archivos.length > MAX_ARCHIVOS) return responder(req, { error: 'Cantidad de archivos inválida.' }, 400);
      let total = 0;
      for (const a of archivos) {
        const ruta = String(a.ruta ?? '');
        total += (a.texto ?? a.dataUrl ?? '').length;
        if (ruta.includes('..') || ruta.startsWith('/')) return responder(req, { error: 'Ruta inválida: ' + ruta }, 400);
        if (!esAdmin) {
          /* un local solo toca su carpeta: menú, fotos y modelos (nada de páginas, nada de borrar) */
          if (!ruta.startsWith(carpeta + '/') || a.borrar || !/\.(json|jpg|png)$/.test(ruta)) return responder(req, { error: 'No se puede publicar ' + ruta }, 403);
          if (a.dataUrl && !/^data:image\/(jpeg|png);base64,/.test(a.dataUrl)) return responder(req, { error: 'Imagen inválida: ' + ruta }, 400);
          if (ruta.endsWith('.json')) JSON.parse(a.texto ?? ''); /* tiene que ser un menú válido */
        }
      }
      if (total > MAX_BYTES) return responder(req, { error: 'Los archivos son demasiado grandes.' }, 413);
      /* un local no manda páginas: si cambió su menú, su página de entrada se arma acá (nombre al día al compartir) */
      const menu = archivos.find((a) => a.ruta === carpeta + '/menu.json');
      if (!esAdmin && menu) archivos.push({ ruta: carpeta + '/index.html', texto: paginaLocal(JSON.parse(menu.texto ?? '{}'), carpeta) });
      await publicar(archivos, String(cuerpo.mensaje ?? 'Actualiza el menú de ' + carpeta).slice(0, 120));
      return responder(req, { ok: true });
    }

    if (cuerpo.accion === 'crear-usuario') {
      if (!esAdmin) return responder(req, { error: 'Solo el administrador puede crear usuarios.' }, 403);
      const carpeta = String(cuerpo.carpeta ?? '');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(carpeta)) return responder(req, { error: 'Carpeta inválida.' }, 400);
      const { data, error } = await servidor.auth.admin.createUser({ email: cuerpo.email, password: cuerpo.password, email_confirm: true });
      if (error) return responder(req, { error: error.message }, 400);
      await servidor.from('usuarios_locales').insert({ user_id: data.user.id, carpeta, rol: 'local' });
      return responder(req, { ok: true });
    }

    return responder(req, { error: 'Acción desconocida.' }, 400);
  } catch (e) {
    return responder(req, { error: String((e as Error).message ?? e) }, 500);
  }
});
