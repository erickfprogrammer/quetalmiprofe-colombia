-- Reemplaza OLD en un trigger BEFORE INSERT por un caso explícito.
create or replace function private.resolve_institutional_verification()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_email text; v_confirmed timestamptz; v_domain text; v_kind text; v_previous timestamptz;
begin
  if tg_op='UPDATE' then v_previous:=old.verified_at; else v_previous:=null; end if;
  select lower(email),email_confirmed_at into v_email,v_confirmed
  from auth.users where id=new.user_id;
  new.verification_status:='none'; new.verified_domain:=null; new.verified_at:=null;
  if v_confirmed is null or v_email is null then return new; end if;
  v_domain:=split_part(v_email,'@',2);
  select d.kind into v_kind
  from public.verified_institution_domains d
  join public.student_universities u on u.code=new.university_code
  where d.domain=v_domain and d.parent_code=coalesce(nullif(u.parent_code,''),u.code)
  limit 1;
  if v_kind is not null then
    new.verification_status:=v_kind;
    new.verified_domain:=v_domain;
    new.verified_at:=coalesce(v_previous,now());
  end if;
  return new;
end $$;
revoke all on function private.resolve_institutional_verification() from public,anon,authenticated;
