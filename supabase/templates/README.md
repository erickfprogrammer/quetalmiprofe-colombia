# Configuración de correos — Qué Tal Mi Profe

Proyecto Supabase: evfjfgpyuwdpbpoqobni. No modificar otras aplicaciones del propietario.

## Estado actual

- El registro, la pantalla /auth/confirm, la verificación OTP y el reenvío están implementados en el frontend.
- Las plantillas HTML están en este directorio; subirlas a GitHub no las activa. Hay que copiarlas en las plantillas de Supabase Auth.
- El SMTP personalizado de Resend y el dominio remitente todavía requieren configuración en los paneles externos.
- Los logs de 12/11/2026 mostraron una primera confirmación exitosa y dos clics posteriores fallidos de un token de un solo uso. La redirección seguía apuntando a localhost:3000.

## 1. Corregir URL de autenticación

Abre https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/url-configuration .

Site URL:
https://quetalmiprofe-colombia.vercel.app

Redirect URLs:
https://quetalmiprofe-colombia.vercel.app/**

La redirección debe cubrir /plataforma y /auth/confirm. No usar localhost:3000 como Site URL de producción. Puedes mantener localhost como URL adicional para pruebas locales si realmente lo necesitas.

## 2. Configurar Resend por SMTP

Necesitas un dominio de envío propio e independiente con permisos DNS. El dominio vercel.app no es válido como remitente personalizable. No reutilices sin autorización el dominio de otro negocio.

En https://resend.com/domains registra el dominio o subdominio apropiado. Completa los registros SPF/DKIM que solicita Resend y espera a que su estado sea Verified (recomendable DMARC).

En https://resend.com/api-keys crea una clave específica para Qué Tal Mi Profe y mantenla solo en el servidor.

En https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/smtp activa Custom SMTP y coloca:
- Sender name: Qué Tal Mi Profe
- Sender email: cuentas@TU_DOMINIO_VERIFICADO (sustituye por uno que de verdad controles)
- Host: smtp.resend.com
- Port: 465
- Username: resend
- Password: la clave Resend que generaste, introducida DIRECTAMENTE en el panel de Supabase.

Fuentes: https://resend.com/changelog/smtp-service y https://supabase.com/docs/guides/auth/auth-smtp .

## 3. Activar la plantilla bonita de confirmación

En https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/templates :

- En Confirm signup, subject: Confirma tu correo | Qué Tal Mi Profe
- Pega el HTML de confirm_signup.html en el editor de Supabase.
- La plantilla usa el token hash de Supabase y envía al usuario a:
  https://quetalmiprofe-colombia.vercel.app/auth/confirm?token_hash={{ .TokenHash }}&type=email
- La página exige pulsar Confirmar mi correo antes de llamar a verifyOtp, con lo que evita consumir el enlace por un mero preview HTTP.
- El enlace solo se puede confirmar una vez. Hay opción de reenvío y de inicio de sesión si la cuenta ya fue activada.

Otras plantillas (opcionales):
- Change email address: asunto Confirma tu nuevo correo | Qué Tal Mi Profe, archivo change_email.html.
- Reset password: asunto Restablecer contraseña | Qué Tal Mi Profe, archivo reset_password.html. El flujo visual para cambiar contraseña no está todavía implementado; no ofrecer esta acción sin crearlo.
- Esas plantillas opcionales usan la variable oficial ConfirmationURL.

## 4. Pruebas de aceptación

1. Tras activar el SMTP y el dominio, registra una cuenta nueva con un correo externo de prueba.
2. El email debe llegar firmado por el dominio propio de Resend, no como noreply@mail.app.supabase.io.
3. El botón debe abrir /auth/confirm del dominio Vercel; todavía no consume el token.
4. Al pulsar Confirmar mi correo debe mostrar éxito y permitir entrar a /plataforma.
5. El reenvío de correo en la pantalla de registro o verificación debe funcionar para cuentas pendientes.
6. Un correo personal confirmado sirve para iniciar sesión, pero no acredita pertenencia universitaria; la publicación de reseñas requiere correo institucional verificado.

## 5. Activación paralela de Google

Google OAuth no se activa a través de Resend. En Supabase Auth > Providers > Google hay que ingresar el Client ID y el Client Secret del proyecto que-tal-mi-profe, sin compartir el secreto en chats o repositorios.
El callback en Google Cloud es:
https://evfjfgpyuwdpbpoqobni.supabase.co/auth/v1/callback

Después de habilitar y probar el proveedor Google, cambia VITE_GOOGLE_OAUTH_ENABLED a true en Vercel y vuelve a desplegar.
