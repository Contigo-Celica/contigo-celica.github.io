# Sitio web — Abg. Jorge Humberto Jaramillo Mena · ADN7 · Celica

Sitio estático (HTML/CSS/JS) + **Supabase** (base de datos, inicio de sesión y almacenamiento de fotos/videos).

- `index.html` · página pública · `parroquia/<nombre>/` · subpáginas de las 5 parroquias
- `admin/` · panel administrativo (requiere cuenta autorizada)
- `assets/js/config.js` · URL y clave pública de Supabase
- `supabase/schema.sql` · estructura y reglas de seguridad de la base de datos

**Lo que se edita en el panel se publica al instante** (se guarda en Supabase, no en GitHub).
Los cambios de código que se suban a GitHub se publican automáticamente en el hosting.

## Seguridad
- Reglas RLS en la base: los visitantes solo leen contenido publicado y pueden enviar ideas; nada más.
- Las ideas ciudadanas (cédula, celular, correo) solo las ve el equipo autorizado; las aprobadas se muestran sin datos personales.
- Anti-spam en la base de datos: validación de cédula, celular y correo, límite de 5 envíos por hora por conexión.
- Roles: **admin** (todo, aprueba/rechaza) y **editor** (sus cambios quedan pendientes).

## Dar acceso al panel
1. Supabase → Authentication → Users → **Add user** (correo + contraseña, marca *Auto Confirm*).
2. El primer administrador: en Supabase → SQL Editor ejecuta
   `insert into public.staff(user_id, email, role) select id, email, 'admin' from auth.users where email = 'CORREO';`
3. Los siguientes se agregan desde el panel → Usuarios.
4. Recomendado: Authentication → Sign In / Providers → desactivar **Allow new users to sign up**.

## Vista local
`python3 -m http.server 8000` y abre http://localhost:8000
