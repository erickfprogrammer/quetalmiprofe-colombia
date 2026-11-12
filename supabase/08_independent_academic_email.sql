-- Separar el correo de acceso del correo académico verificado.
-- Nunca se envía ni cambia el email primario de auth.users en este flujo.
create table if not exists public.academic_email_challenges (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 university_code text not null references public.student_universities(code),
 academic_email text not null,
 otp_digest text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 attempts integer not null default 0 check (attempts between 0 and 5),
 consumed_at timestamptz,
 delivery_state text not null default 'queued' check (delivery_state in ('queued','sent')),
 constraint academic_challenge_email_format check (academic_email=lower(academic_email) and academic_email like '%@%.%')
);
create index if not exists academic_challenges_user_time_idx
 on public.academic_email_challenges(user_id,created_at desc);
alter table public.academic_email_challenges enable row level security;
revoke all on public.academic_email_challenges from anon,authenticated;
grant select,insert,update,delete on public.academic_email_challenges to service_role;

alter table public.student_profiles add column if not exists verified_academic_email text;
revoke update(verified_academic_email) on public.student_profiles from authenticated;
create unique index if not exists unique_verified_academic_email
 on public.student_profiles (lower(verified_academic_email))
 where verified_academic_email is not null;

-- Mantener verificación académica independiente de la dirección personal de inicio de sesión.
-- Una modificación real de universidad invalida el vínculo institucional anterior.
create or replace function private.resolve_institutional_verification()
returns trigger language plpgsql security definer set search_path='' as $$
declare
 v_email text; v_confirmed timestamptz; v_domain text; v_kind text; v_previous timestamptz;
begin
 if tg_op='UPDATE' then
   if old.university_code is not distinct from new.university_code
      and old.verified_academic_email is not null
      and old.verification_status in ('institutional','student_domain') then
     new.verification_status:=old.verification_status;
     new.verified_domain:=old.verified_domain;
     new.verified_at:=old.verified_at;
     new.verified_academic_email:=old.verified_academic_email;
     return new;
   end if;
   v_previous:=old.verified_at;
 else
   v_previous:=null;
 end if;
 select lower(email),email_confirmed_at into v_email,v_confirmed
 from auth.users where id=new.user_id;
 new.verification_status:='none';
 new.verified_domain:=null;
 new.verified_at:=null;
 new.verified_academic_email:=null;
 if v_confirmed is null or v_email is null then return new; end if;
 v_domain:=split_part(v_email,'@',2);
 select d.kind into v_kind
 from public.verified_institution_domains d
 join public.student_universities u on u.code=new.university_code
 where d.domain=v_domain
   and d.parent_code=coalesce(nullif(u.parent_code,''),u.code)
 limit 1;
 if v_kind is not null then
   new.verification_status:=v_kind;
   new.verified_domain:=v_domain;
   new.verified_at:=coalesce(v_previous,now());
   new.verified_academic_email:=v_email;
 end if;
 return new;
end $$;
revoke all on function private.resolve_institutional_verification() from public,anon,authenticated;
