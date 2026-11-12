# Qué Tal Mi Profe — Colombia

Plataforma de experiencias de docentes universitarios, creada con React 19, Vite, Supabase Auth, PostgreSQL RLS y Vercel.

## Registro universitario y protección de identidad (12 nov 2026)

- Registro por correo + contraseña: universidad/sede del catálogo nacional obligatoria. Programa y semestre opcionales.
- Google OAuth: desarrollado en el frontend usando Supabase Auth. Tras la primera sesión, si falta perfil, el usuario debe completar obligatoriamente la universidad antes de opinar o registrar docentes.
- Privacidad: la universidad y programa se guardan en student_profiles. public_reviews no contiene nombre, email, Google ID, identificador de autor, carrera ni universidad.
- Anonimato PUBLICO. Los moderadores autorizados pueden acceder a datos internos para prevenir abusos, y pueden estar sujetos a requerimientos legales.
- El panel de moderación ofrece recuentos de usuarios por universidad mediante university_student_counts, vista PostgreSQL con security_invoker=true. Los datos de pertenencia son autodeclarados, NO se verifica matrícula.

### Migración del perfil universitario (YA aplicada a la base de datos actual)

El archivo supabase/02_student_profiles.sql crea student_universities, student_profiles, university_student_counts y el trigger de inscripción inicial, con RLS y catálogo de 361 registros. En instalaciones nuevas, ejecutar primero supabase/schema.sql y luego supabase/02_student_profiles.sql.

### Activar Google en este proyecto (PENDIENTE DE CONFIGURACIÓN OAUTH EXTERNA)

1. Google Cloud Auth: https://console.cloud.google.com/auth/overview . Configurar consentimiento y audiencia Externa, ámbitos openid, email y profile.
2. Crear OAuth Client ID de tipo Web application en https://console.cloud.google.com/auth/clients .
3. Authorized JavaScript origins: https://quetalmiprofe-colombia.vercel.app
4. Authorized Redirect URI (de GOOGLE, que dirige a Supabase): https://evfjfgpyuwdpbpoqobni.supabase.co/auth/v1/callback
5. En https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/providers activar Google y configurar Client ID y Client Secret desde Google Cloud. NO guardar Client Secret en GitHub, frontend ni variables VITE.
6. En https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/url-configuration configurar Site URL https://quetalmiprofe-colombia.vercel.app y añadir ese origen a los Redirect URLs permitidos.
7. Probar login Google con un usuario externo, confirmar selector de universidad, guardar perfil, salir y volver a entrar. Google puede exigir usuarios de prueba o verificación de marca.

El botón Google está desarrollado en el frontend; no funcionará hasta crear el cliente OAuth y activar el proveedor.

### Activar registro de correo para público (SMTP PENDIENTE)

El SMTP de prueba de Supabase limita el envío a direcciones autorizadas del equipo. Configurar proveedor externo en https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/smtp antes de lanzar registro manual de alumnos. Mantener confirmación de correo, CAPTCHA y protecciones antiabuso.

Docs: https://supabase.com/docs/guides/auth/social-sign-in/auth-google y https://supabase.com/docs/guides/auth/auth-smtp


## Experiencia web (12 nov 2026)

La navegación ahora se divide en dos vistas que comparten el mismo proyecto, datos y dominio:

- `/`: landing page pública de bienvenida. Presenta el propósito de la plataforma, un buscador de profesores y universidades, el flujo de uso, un ejemplo visual explícitamente ilustrativo, preguntas frecuentes y el enfoque de anonimato público. Permite iniciar sesión o registrarse en un modal sobre la propia landing.
- `/plataforma`: el directorio y la aplicación de reseñas real, con filtros, fichas de profesores, solicitudes, calificaciones y el panel de moderación existente. Se puede explorar sin cuenta; para escribir reseñas o proponer docentes se requiere autenticación y perfil universitario.
- Buscar desde la landing abre automáticamente la plataforma y conserva el texto y la categoría de búsqueda. El logo y la ruta de navegación devuelven al inicio. Las URLs directas funcionan mediante rewrites SPA en Vercel.
- El diseño de la landing es original, toma como inspiración las buenas prácticas de descubrimiento de plataformas de valoración de profesores, sin reutilizar logos, nombres, imágenes, textos ni otros activos de Rate My Professors.
- El catálogo universitario sigue siendo un conjunto de registros de sedes e instituciones, no un directorio exhaustivo de docentes. La experiencia muestra estados vacíos reales, sin reseñas artificiales.

## Funciones MVP
- 361 registros de instituciones y sedes del Ministerio de Educación/SNIES (snapshot del archivo Datos Abiertos; corte de datos previo a 2026).
- Búsqueda por nombre, universidad, ciudad o departamento.
- Agregar profesores, con aprobación obligatoria antes de publicarlos.
- Registro por correo y contraseña.
- Reseñas: enseñanza 1–5, dificultad 1–5, volvería a tomar clase, materia, semestre, hasta cuatro etiquetas y opinión.
- Opiniones sin identidad visible públicamente. La tabla pública no almacena identificadores de autor.
- Reportes y panel de moderación; duplicados y límites básicos por cuenta.
- Diseño responsive y estados vacíos reales sin reseñas inventadas.

## Estado de infraestructura al 12 de noviembre de 2026
- Sitio publicado: https://quetalmiprofe-colombia.vercel.app
- Proyecto Supabase independiente creado: `QueTalMiProfeColombia` (`evfjfgpyuwdpbpoqobni`) en la organización Legendarios Civil.
- Esquema SQL aplicado: cinco tablas con RLS, once políticas, comprobación de seguridad sin alertas.
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` instaladas en Vercel. La clave publicable no se almacena en el repositorio.
- Falta **habilitar correo transaccional externo (SMTP)** y configurar **Auth → URL Configuration** antes de aceptar cuentas de estudiantes fuera del equipo.

## Puesta en marcha del backend
1. Crear un proyecto Supabase INDEPENDIENTE de otros negocios.
2. Ejecutar en SQL Editor el archivo supabase/schema.sql.
3. Configurar Supabase Authentication → Email y URL Configuration con el dominio real Vercel.
4. En Vercel → Environment Variables crear VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (publishable key, nunca service_role) para production y preview.
5. Volver a desplegar. El registro y las reseñas empezarán a persistir.
6. Crear una cuenta en la app. En SQL Editor asignar el rol al UUID correspondiente:
   update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}'::jsonb where id = 'REEMPLAZAR_CON_UUID';
   Cerrar sesión y volver a iniciarla para obtener el nuevo claim.

## Modelo de seguridad
professor_requests y review_entries guardan información privada de autor, visible solo para su cuenta y moderadores. El admin aprueba solicitudes desde el panel; los triggers publican copias sin autor en professors y public_reviews. Reportes reciben tratamiento privado. Todas las tablas públicas tienen RLS. Auth y envío exigen cuenta (anonimato público, no anonimato frente al operador).

## Ejecución local
npm install
npm run dev
npm run build

Copiar .env.example a .env.local y completar las variables.

## Fuentes
Catálogo nacional: https://www.datos.gov.co/Educaci-n/MEN_INSTITUCIONES-EDUCACI-N-SUPERIOR/n5yy-8nav/about_data
Consulta activa SNIES: https://hecaa.mineducacion.gov.co/consultaspublicas/ies
Se importan sedes principales y seccionales. El directorio es estático y requiere actualizaciones periódicas.

## No incluido en esta versión
Pagos con pasarela, verificación institucional de estudiantes, moderación algorítmica avanzada, CAPTCHA, notificaciones, procedimiento legal completo de rectificación/eliminación. Antes del lanzamiento masivo definir tratamiento de datos y atención a docentes, de acuerdo con Ley 1581 de 2012.

Idea comercial posterior: COP 10.000 una sola vez por herramientas premium opcionales como comparaciones detalladas, filtros y alertas; mantener públicas las opiniones y nunca cobrar para borrar o evitar reseñas negativas.

Producto independiente; no afiliado a Rate My Professors.

## Pendientes antes del lanzamiento público
1. Abrir [Auth → URL Configuration](https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/url-configuration). Establecer **Site URL** `https://quetalmiprofe-colombia.vercel.app` y agregar `https://quetalmiprofe-colombia.vercel.app/**` a **Redirect URLs**.
2. Abrir [Auth → SMTP](https://supabase.com/dashboard/project/evfjfgpyuwdpbpoqobni/auth/smtp) y conectar un proveedor SMTP propio de la nueva marca; Supabase restringe su SMTP de prueba a destinatarios autorizados del equipo. Mantener la confirmación de correo activa.
3. Probar registro/confirmación con correo externo y flujo real de alta, calificación, reporte y aprobación. Sin SMTP no está validado el registro público.
4. Registrar una cuenta del responsable y asignar rol `admin` mediante un administrador de Supabase; verificar permisos al reingresar.
5. Antes de recopilar opiniones de público, completar política de datos, responsable, términos, contactos y procedimiento de rectificación o retiro; instalar CAPTCHA y protección antiabuso.

Documentación oficial: https://supabase.com/docs/guides/auth/auth-smtp

### Bandera de disponibilidad de Google

El botón OAuth se muestra como pendiente por seguridad mientras el proveedor no esté configurado. Después de activar Google en Google Cloud y Supabase, establecer VITE_GOOGLE_OAUTH_ENABLED=true en las variables de Vercel (production/preview) y volver a desplegar. Esta bandera sólo gestiona el estado visual del botón; no sustituye la validación del proveedor.
