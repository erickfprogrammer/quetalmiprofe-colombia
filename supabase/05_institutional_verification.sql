-- Comprobación institucional: nunca equivale a matrícula vigente.
-- No se guardan credenciales de la universidad; solo el dominio confirmado por Supabase Auth.
create table if not exists public.verified_institution_domains (
 domain text primary key check (domain=lower(domain) and domain !~ '\s' and domain like '%.%'),
 parent_code text not null,
 kind text not null check (kind in ('student_domain','institutional')),
 source_url text not null default '',
 created_at timestamptz not null default now()
);
alter table public.verified_institution_domains enable row level security;
revoke all on public.verified_institution_domains from anon,authenticated;
grant select on public.verified_institution_domains to anon,authenticated;
create policy "Institution domains are publicly readable" on public.verified_institution_domains
 for select to anon,authenticated using (true);

insert into public.verified_institution_domains(domain,parent_code,kind,source_url)
values
 ('estudiantes.areandina.edu.co','2728','student_domain','https://mooc.areandina.edu.co/manuales/Manual_Estudiantes_Canvas.pdf'),
 ('areandina.edu.co','2728','institutional','https://www.areandina.edu.co/'),
 ('unicesar.edu.co','1120','institutional','https://aguachica.unicesar.edu.co/documentos/1.mecanismoseleccionyevaluacion/documento1.pdf'),
 ('unal.edu.co','1101','institutional','https://identidad.unal.edu.co/guia-web/b-directrices-y-especificaciones/b4-plantilla-para-correos-electronicos/'),
 ('udea.edu.co','1201','institutional','https://www.udea.edu.co/'),
 ('uninorte.edu.co','1713','institutional','https://www.uninorte.edu.co/web/dtic/software-estudiantes'),
 ('uniandes.edu.co','1813','institutional','https://cuenta.uniandes.edu.co/')
on conflict(domain) do update set parent_code=excluded.parent_code,kind=excluded.kind,source_url=excluded.source_url;

alter table public.student_profiles
 add column if not exists verification_status text not null default 'none'
 check (verification_status in ('none','institutional','student_domain')),
 add column if not exists verified_domain text,
 add column if not exists verified_at timestamptz;
-- Crucial: impedir que el usuario asigne su propio estado de verificación.
revoke insert,update on public.student_profiles from authenticated;
grant insert(user_id,university_code,study_program,semester) on public.student_profiles to authenticated;
grant update(university_code,study_program,semester) on public.student_profiles to authenticated;

create or replace function private.resolve_institutional_verification()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_email text;
  v_confirmed timestamptz;
  v_domain text;
  v_kind text;
begin
  select lower(email),email_confirmed_at into v_email,v_confirmed
  from auth.users where id=new.user_id;
  new.verification_status:='none';
  new.verified_domain:=null;
  new.verified_at:=null;
  if v_confirmed is null or v_email is null then return new; end if;
  v_domain:=split_part(v_email,'@',2);
  select d.kind into v_kind from public.verified_institution_domains d
  join public.student_universities u on u.code=new.university_code
  where d.domain=v_domain and d.parent_code=coalesce(nullif(u.parent_code,''),u.code)
  limit 1;
  if v_kind is not null then
    new.verification_status:=v_kind;
    new.verified_domain:=v_domain;
    new.verified_at:=coalesce(old.verified_at,now());
  end if;
  return new;
end $$;
drop trigger if exists resolve_institutional_verification on public.student_profiles;
create trigger resolve_institutional_verification
before insert or update of university_code on public.student_profiles
for each row execute function private.resolve_institutional_verification();

create or replace function private.refresh_profile_after_auth_confirmation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (new.email_confirmed_at is distinct from old.email_confirmed_at) or
     (new.email is distinct from old.email) then
    update public.student_profiles p set university_code=p.university_code
    where p.user_id=new.id;
  end if;
  return new;
end $$;
drop trigger if exists refresh_institution_on_auth_email on auth.users;
create trigger refresh_institution_on_auth_email
after update of email,email_confirmed_at on auth.users
for each row execute function private.refresh_profile_after_auth_confirmation();
revoke all on function private.resolve_institutional_verification() from public,anon,authenticated;
revoke all on function private.refresh_profile_after_auth_confirmation() from public,anon,authenticated;

-- A partir de esta migración, solamente cuentas con correo institucional confirmado
-- y que coincide con su institución declarada pueden enviar reseñas y docentes.
alter policy "Authors submit requests pending" on public.professor_requests
with check (
 submitted_by=(select auth.uid()) and status='pending'
 and exists (select 1 from public.student_profiles sp where sp.user_id=(select auth.uid())
  and sp.verification_status in ('institutional','student_domain'))
);
alter policy "Authors submit reviews pending" on public.review_entries
with check (
 author_id=(select auth.uid()) and status='pending'
 and exists (select 1 from public.student_profiles sp where sp.user_id=(select auth.uid())
  and sp.verification_status in ('institutional','student_domain'))
);
-- Recalcular perfiles existentes (no altera university_code).
update public.student_profiles set university_code=university_code;
