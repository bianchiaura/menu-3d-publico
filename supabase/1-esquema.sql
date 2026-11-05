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
