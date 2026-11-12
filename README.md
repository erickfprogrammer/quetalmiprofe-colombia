# Qué Tal Mi Profe — Colombia

Plataforma de experiencias de docentes universitarios, creada con React 19, Vite, Supabase Auth, PostgreSQL RLS y Vercel.

## Funciones MVP
- 361 registros de instituciones y sedes del Ministerio de Educación/SNIES (snapshot del archivo Datos Abiertos; corte de datos previo a 2026).
- Búsqueda por nombre, universidad, ciudad o departamento.
- Agregar profesores, con aprobación obligatoria antes de publicarlos.
- Registro por correo y contraseña.
- Reseñas: enseñanza 1–5, dificultad 1–5, volvería a tomar clase, materia, semestre, hasta cuatro etiquetas y opinión.
- Opiniones sin identidad visible públicamente. La tabla pública no almacena identificadores de autor.
- Reportes y panel de moderación; duplicados y límites básicos por cuenta.
- Diseño responsive y estados vacíos reales sin reseñas inventadas.

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
