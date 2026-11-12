# Correo universitario sin comprar dominio — Qué Tal Mi Profe

## Qué se corrigió el 12 nov 2026
- La cuenta se puede registrar con Google o email personal, que sigue siendo el email principal de acceso.
- Una verificación académica ya **no** invoca auth.updateUser({email}). Ya no intenta cambiar la dirección personal ni envía dobles confirmaciones a personal+académico.
- Se usa una función independiente Supabase Edge: academic-email-verification, con código aleatorio de **8 dígitos**, válido 15 minutos, 5 intentos de comprobación y máximo 3 solicitudes por hora por usuario.
- El mensaje SOLO se dirige a la dirección académica que el estudiante escribe y cuyo dominio coincide con su universidad.
- En Supabase, una tabla privada con RLS cerrada almacena hashes SHA-256 de códigos; la cuenta personal no puede modificar su estado de verificación. Se verifica el JWT del usuario, se valida el dominio institucional, y el correo se reserva a una única cuenta.
- El estado verificado se revoca si el estudiante cambia de universidad. Los comentarios continúan sin nombre ni email públicamente.
- Los códigos llegan con HTML original de Qué Tal Mi Profe cuando el servicio SMTP está configurado.
- No se enviará ningún código ni aparecerá un falso mensaje de éxito mientras falte el proveedor SMTP.
- Atención: verificar el control de un correo universitario no comprueba matrícula actual.

## Por qué falló el envío anterior

Los logs oficiales registraron el 12/11/2026:
- La confirmación del email personal fue exitosa.
- El flujo anterior updateUser(email) pidió cambiar el correo principal a un correo estudiantil de Areandina. Supabase (con Secure Email Change) envió a AMBAS direcciones.
- La cuenta personal sigue confirmada y la dirección académica es un cambio pendiente; el vínculo universitario todavía consta como no verificado.
- Un intento posterior fue rechazado por HTTP 429, límite de emails alcanzado. El proveedor previo era el envío de prueba de Supabase, inadecuado para cuentas externas.
- No es necesario volver a registrarse ni completar los enlaces antiguos de cambio de dirección.

## Sin dominio de pago: Gmail SMTP para pruebas

Resend requiere verificar un dominio que controles para enviar a estudiantes arbitrarios. NO usar el dominio .vercel.app como remitente. Si por ahora no quieres comprar dominio, el piloto puede usar SMTP de un **Gmail independiente** (ejemplo: crear una cuenta dedicada a Qué Tal Mi Profe), aunque tiene límites y no es la mejor opción para un lanzamiento masivo.

1. Crear o elegir un Gmail de envío cuya administración sea independiente de otros negocios. Activar verificación de 2 pasos.
2. En https://myaccount.google.com/apppasswords generar **una contraseña de aplicación** para SMTP de Qué Tal Mi Profe. Es un secreto: no publicarlo en el repositorio, Vercel ni ChatGPT. Si la cuenta no permite contraseñas de aplicación, usar otro proveedor SMTP legítimo o cuenta apta.
3. En https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/settings/functions añadir estos cinco secretos al proyecto (usar el Gmail elegido, no una dirección inventada):

ACADEMIC_SMTP_HOST=smtp.gmail.com
ACADEMIC_SMTP_PORT=465
ACADEMIC_SMTP_USER=EL_GMAIL_DE_ENVIO
ACADEMIC_SMTP_PASS=CONTRASENA_DE_APLICACION_DE_GOOGLE
ACADEMIC_SMTP_FROM=EL_MISMO_GMAIL_DE_ENVIO

NO añadirlos a variables VITE_, a GitHub ni al frontend. Todos se leen solo dentro de Supabase Edge Functions.

4. En Supabase > Authentication > SMTP (https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/smtp), si deseas que los emails de alta/recuperación de cuentas personales también lleguen a destinatarios externos, activa Custom SMTP con:
  - Sender name: Qué Tal Mi Profe
  - Sender email: EL_GMAIL_DE_ENVIO
  - Host: smtp.gmail.com
  - Port: 465
  - Username: EL_GMAIL_DE_ENVIO
  - Password: CONTRASENA_DE_APLICACION_DE_GOOGLE
  - Mantén habilitada la confirmación de correo.
  Esto es distinto del envío universitario: el **correo de confirmación de la cuenta personal** va al personal, mientras que el **código universitario** va al académico.

5. Comprobar https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/url-configuration :
  - Site URL: https://quetalmiprofe-colombia.vercel.app
  - Redirect URL adicional: https://quetalmiprofe-colombia.vercel.app/**
  - No dejar http://localhost:3000 como Site URL de producción.

6. Registrar una cuenta nueva de prueba en la web, confirmar su email personal, iniciar sesión, elegir universidad y pulsar Verificar. Introducir correo académico reconocido y solicitar código. Esperar el mensaje en la bandeja académica, copiar los 8 dígitos y comprobar que el perfil cambia a verificado **sin cambiar el correo personal de inicio**.

## Enlaces clave
- Backend: https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/functions
- Estado envío: https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/smtp
- Credenciales SMTP de Google: https://support.google.com/mail/answer/185833
- Guía Supabase Gmail SMTP: https://supabase.com/kb/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y
- Resend solo después de contar con un dominio remitente verificado: https://resend.com/domains

## Cuando exista un dominio propio
Sustituir Gmail SMTP por Resend (smtp.resend.com:465, usuario resend, contraseña API key, FROM = email en dominio verificado) **solo después de confirmar la titularidad del dominio**. No hace falta cambiar el código de verificación ni el dominio público del sitio hasta que el usuario lo indique.
