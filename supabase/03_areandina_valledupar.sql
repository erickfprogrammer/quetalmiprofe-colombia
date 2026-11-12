-- Sede Valledupar confirmada en el directorio institucional de Areandina.
-- Fuente: https://www.areandina.edu.co/sedes-y-csu/
-- El código 'areandina-valledupar' es un identificador INTERNO de la plataforma, NO un código SNIES.
insert into public.student_universities(code,name,city,department,campus_type,status)
values ('areandina-valledupar','Fundación Universitaria del Área Andina (Areandina)','Valledupar','Cesar','Sede Valledupar','Activa · sede verificada en sitio institucional (12/11/2026)')
on conflict (code) do update set
 name=excluded.name,city=excluded.city,department=excluded.department,
 campus_type=excluded.campus_type,status=excluded.status;

update public.student_universities set name='Fundación Universitaria del Área Andina (Areandina)' where code in ('2728','2737');
