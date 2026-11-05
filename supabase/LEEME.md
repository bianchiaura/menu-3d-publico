# Supabase: pasos para activarlo

Supabase va a dar: **usuario y contraseña para cada local** (para que publiquen sin tu token de GitHub) y **estadísticas** (cuántos abren el menú y qué platos miran en 3D). El plan gratis alcanza.

Hacelo en este orden. Son unos 15 minutos.

## A. Cuenta y proyecto
1. Entrá a https://supabase.com → **Start your project** → **Continue with GitHub** (con tu cuenta `ronkstudio`).
2. **New project**:
   - Organization: la tuya (plan **Free**).
   - Name: `menu-3d`.
   - Database password: tocá **Generate a password** y **guardala en tu administrador de contraseñas**.
   - Region: **South America (São Paulo)**.
   - **Create new project** y esperá 1 o 2 minutos.

## B. Base de datos
3. Menú de la izquierda → **SQL Editor** → **New query**.
4. Abrí [1-esquema.sql](https://github.com/ronkstudio/menu-3d-publico/blob/main/supabase/1-esquema.sql), tocá el botón **Copy raw file** (arriba a la derecha del archivo), pegalo en Supabase y tocá **Run**. Tiene que decir *Success*.

## C. Tu usuario de administrador
5. **Authentication** → **Users** → **Add user** → **Create new user**: tu mail y una contraseña nueva (guardala). Marcá **Auto Confirm User** → **Create user**.
6. **SQL Editor** → **New query** → pegá [2-hacerme-admin.sql](https://github.com/ronkstudio/menu-3d-publico/blob/main/supabase/2-hacerme-admin.sql), cambiá `TU_MAIL_ACA` por tu mail → **Run**. Abajo tiene que aparecer tu mail con rol `admin`.
7. **Authentication** → **Sign In / Providers** → apagá **Allow new users to sign up** → **Save**. Así nadie puede crearse una cuenta solo: los usuarios los creás vos desde tu panel.

## D. El "intermediario" que publica
8. Creá un **token de GitHub nuevo** solo para Supabase (mismos pasos de siempre: solo `menu-3d-publico`, **Contents: Read and write**). Nombre: *Supabase Menú 3D*. Vencimiento: 1 año. Copialo.
9. En Supabase: **Edge Functions** → **Secrets** → agregá este y guardá:
   - `GITHUB_TOKEN` → el token del paso 8
10. **Edge Functions** → **Deploy a new function** → **Via Editor**. Nombre: `panel`. Borrá el ejemplo, pegá [3-funcion-panel.ts](https://github.com/ronkstudio/menu-3d-publico/blob/main/supabase/3-funcion-panel.ts) (con **Copy raw file**) → **Deploy function**.

## E. Pasarle los datos a Claude
11. **Project Settings** (engranaje) → **API Keys** (o **Data API**). Copiá:
    - **Project URL** (`https://xxxx.supabase.co`)
    - **Publishable key** (empieza con `sb_publishable_`; en proyectos viejos se llama *anon public*)

    Esos dos son **públicos**: se pueden pegar en el chat sin riesgo.

    **Nunca compartas** la *secret key* / *service_role*, la contraseña de la base ni tus tokens.

Listo (noviembre 2026): los paneles ya usan el inicio de sesión, publican a través de la función `panel`, el administrador crea el usuario de cada local desde su tarjeta y se ven las estadísticas.
