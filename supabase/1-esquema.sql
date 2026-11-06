-- Menú 3D · base de datos en Supabase
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Se puede correr más de una vez sin romper nada.

-- 1) Quién puede editar qué local
--    rol 'admin'  = vos (carpeta '*', puede todo)
--    rol 'local'  = un restaurante (solo su carpeta)
create table if not exists public.usuarios_locales (
  user_id  uuid not null references auth.users(id) on delete cascade,
  carpeta  text not null check (carpeta ~ '^([a-z0-9][a-z0-9-]*|\*)$'),
  rol      text not null default 'local' check (rol in ('local', 'admin')),
  creado   timestamptz not null default now(),
  primary key (user_id, carpeta)
);
alter table public.usuarios_locales enable row level security;

-- cada usuario solo puede ver sus propios permisos (los cambios los hace el servidor)
drop policy if exists "ver mis permisos" on public.usuarios_locales;
create policy "ver mis permisos" on public.usuarios_locales
  for select to authenticated using (user_id = auth.uid());

-- 2) Estadísticas: cada vez que alguien abre un menú o mira un plato en 3D / AR
create table if not exists public.vistas (
  id       bigint generated always as identity primary key,
  carpeta  text not null check (carpeta ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  plato    text check (plato is null or char_length(plato) <= 20),
  tipo     text not null check (tipo in ('menu', '3d', 'ar')),
  idioma   text check (idioma in ('es', 'en')),
  creado   timestamptz not null default now()
);
alter table public.vistas enable row level security;
create index if not exists vistas_carpeta_fecha on public.vistas (carpeta, creado);

-- cualquiera (el menú público) puede ANOTAR una vista, pero no leerlas
drop policy if exists "anotar vistas" on public.vistas;
create policy "anotar vistas" on public.vistas
  for insert to anon, authenticated with check (true);

-- leer las estadísticas: el admin ve todas, cada local solo las suyas
drop policy if exists "ver mis estadisticas" on public.vistas;
create policy "ver mis estadisticas" on public.vistas
  for select to authenticated using (
    exists (
      select 1 from public.usuarios_locales u
      where u.user_id = auth.uid() and (u.rol = 'admin' or u.carpeta = vistas.carpeta)
    )
  );

-- 3) Resumen por día (hora de Argentina) y por plato, para mostrar en los paneles
create or replace view public.resumen_vistas with (security_invoker = true) as
  select carpeta, (creado at time zone 'America/Argentina/Buenos_Aires')::date as dia, tipo, plato, count(*)::int as cantidad
  from public.vistas
  group by 1, 2, 3, 4;

-- 4) Aperturas del menú por día, hora (de Argentina) e idioma: para "horas pico" y "turistas"
create or replace view public.resumen_aperturas with (security_invoker = true) as
  select carpeta,
         (creado at time zone 'America/Argentina/Buenos_Aires')::date as dia,
         extract(hour from creado at time zone 'America/Argentina/Buenos_Aires')::int as hora,
         coalesce(idioma, 'es') as idioma,
         count(*)::int as cantidad
  from public.vistas
  where tipo = 'menu'
  group by 1, 2, 3, 4;

-- 5) Plan de cada local (lo que contrató y cómo pagó). Solo el administrador lo ve y lo cambia: no va al repo público.
create table if not exists public.planes (
  carpeta     text primary key check (carpeta ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  plan        text not null check (plan in ('esencial', 'completo', 'premium')),
  pago        text not null check (pago in ('mensual', 'semestral', 'anual')),
  desde       date not null default current_date,   -- fecha del último pago
  actualizado timestamptz not null default now()
);
alter table public.planes enable row level security;
drop policy if exists "solo el administrador" on public.planes;
create policy "solo el administrador" on public.planes
  for all to authenticated
  using (exists (select 1 from public.usuarios_locales u where u.user_id = auth.uid() and u.rol = 'admin'))
  with check (exists (select 1 from public.usuarios_locales u where u.user_id = auth.uid() and u.rol = 'admin'));

-- 6) Cuándo se le mandó a cada local el último resumen del mes y el último aviso de pago
alter table public.planes add column if not exists resumen_enviado date;
alter table public.planes add column if not exists aviso_enviado date;

-- 7) Pagos de cada local: cada renovación queda anotada y se puede deshacer (desde_antes guarda cómo estaba el plan).
--    Los escribe solo la función "panel"; el administrador los lee. Un local ve los suyos a través de la función.
create table if not exists public.pagos (
  id          bigint generated always as identity primary key,
  carpeta     text not null check (carpeta ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  fecha       date not null,                          -- cuándo se registró (hora de Argentina)
  plan        text not null,
  pago        text not null,
  monto       integer,
  desde_antes date not null,                          -- inicio del período anterior
  desde_nuevo date not null,                          -- inicio del período que se pagó
  origen      text not null check (origen in ('local', 'admin')),
  estado      text not null default 'ok' check (estado in ('revisar', 'ok', 'anulado')),
  comprobante text,                                   -- ruta del archivo en el depósito "comprobantes"
  huella      text,                                   -- identifica el archivo: el mismo comprobante no se usa dos veces
  creado      timestamptz not null default now()
);
create unique index if not exists pagos_comprobante_unico on public.pagos (carpeta, huella) where huella is not null;
create index if not exists pagos_carpeta on public.pagos (carpeta, id desc);
alter table public.pagos enable row level security;
drop policy if exists "el administrador ve los pagos" on public.pagos;
create policy "el administrador ve los pagos" on public.pagos
  for select to authenticated
  using (exists (select 1 from public.usuarios_locales u where u.user_id = auth.uid() and u.rol = 'admin'));

-- 8) Comprobantes: depósito privado (sin reglas de acceso: solo entra la función "panel")
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- 9) Difusión: restaurantes a los que escribirles. Solo el administrador la ve: no va al repo público.
create table if not exists public.prospectos (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  barrio    text,
  direccion text,
  mail      text,
  telefono  text,                                     -- como se muestra
  whatsapp  text check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  web       text,
  fuente    text,                                     -- de dónde salió el dato
  estado    text not null default 'nuevo' check (estado in ('nuevo', 'enviado', 'respondio', 'interesado', 'sin-whatsapp', 'no-escribir')),
  enviado   date,
  via       text check (via is null or via in ('whatsapp', 'mail')),
  creado    timestamptz not null default now()
);
create unique index if not exists prospectos_unico on public.prospectos (lower(nombre), coalesce(lower(direccion), ''));
alter table public.prospectos enable row level security;
drop policy if exists "solo el administrador" on public.prospectos;
create policy "solo el administrador" on public.prospectos
  for all to authenticated
  using (exists (select 1 from public.usuarios_locales u where u.user_id = auth.uid() and u.rol = 'admin'))
  with check (exists (select 1 from public.usuarios_locales u where u.user_id = auth.uid() and u.rol = 'admin'));

-- 10) Estadísticas: también se cuenta cuando alguien envía una reserva o un pedido por WhatsApp (sin datos de quién)
alter table public.vistas drop constraint if exists vistas_tipo_check;
alter table public.vistas add constraint vistas_tipo_check check (tipo in ('menu', '3d', 'ar', 'reserva', 'pedido'));
