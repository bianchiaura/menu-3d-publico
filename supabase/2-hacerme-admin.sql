-- Menú 3D · marcarte como administrador
-- Correlo DESPUÉS de crear tu usuario en Authentication → Users.
-- Antes de tocar Run, cambiá TU_MAIL_ACA por el mail con el que creaste tu usuario (dejá las comillas).

insert into public.usuarios_locales (user_id, carpeta, rol)
select id, '*', 'admin' from auth.users where email = 'TU_MAIL_ACA'
on conflict do nothing;

-- Tiene que mostrar una fila con tu mail y rol admin:
select u.email, l.carpeta, l.rol
from public.usuarios_locales l join auth.users u on u.id = l.user_id;
