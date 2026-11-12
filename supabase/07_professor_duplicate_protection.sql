-- Normalizar nombres de docentes con independencia de mayúsculas, tildes, dobles espacios.
create or replace function private.normalized_professor_name(p_name text)
returns text language sql immutable strict parallel safe set search_path='' as $$
  select pg_catalog.translate(
    pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.btrim(p_name)), '\s+', ' ', 'g'),
    'áàäâéèëêíìïîóòöôúùüûñ','aaaaeeeeiiiioooouuuun'
  );
$$;
revoke all on function private.normalized_professor_name(text) from public,anon,authenticated;
-- Protección transaccional ante concurrencia de solicitudes y aprobaciones.
create unique index if not exists professors_unique_normalized_per_campus
on public.professors (university_code,private.normalized_professor_name(name));
create unique index if not exists pending_professors_unique_normalized_per_campus
on public.professor_requests (university_code,private.normalized_professor_name(name))
where status='pending';

create or replace function private.prevent_duplicate_professor_request()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.name:=pg_catalog.regexp_replace(pg_catalog.btrim(new.name),'\s+',' ','g');
 if exists (
  select 1 from public.professors p
  where p.university_code=new.university_code
  and private.normalized_professor_name(p.name)=private.normalized_professor_name(new.name)
 ) then
  raise exception 'El profesor ya existe en esta universidad. Abre su perfil para calificarlo.'
    using errcode='23505',constraint='professors_unique_normalized_per_campus';
 end if;
 return new;
end $$;
drop trigger if exists prevent_duplicate_professor_request on public.professor_requests;
create trigger prevent_duplicate_professor_request before insert on public.professor_requests
for each row execute function private.prevent_duplicate_professor_request();

create or replace function private.publish_professor_request()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and old.status is distinct from 'approved' then
  insert into public.professors(id,name,university_code,university_name,campus)
  values(new.id,new.name,new.university_code,new.university_name,new.campus);
 end if;
 return new;
end $$;
revoke all on function private.prevent_duplicate_professor_request() from public,anon,authenticated;
revoke all on function private.publish_professor_request() from public,anon,authenticated;
