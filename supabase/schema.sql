-- Qué Tal Mi Profe (2026) - esquema Supabase/Postgres
-- Ejecutar en un proyecto separado de otras aplicaciones.
create extension if not exists pgcrypto;
create schema if not exists private;
create table if not exists public.professors (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 5 and 120),
 university_code text not null,
 university_name text not null,
 campus text not null default '' check(char_length(campus)<=100),
 created_at timestamptz not null default now()
);
create index if not exists professors_by_university on public.professors(university_code,name);
create unique index if not exists unique_professor_at_university on public.professors(university_code,lower(name));
create table if not exists public.professor_requests (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 5 and 120),
 university_code text not null,
 university_name text not null,
 campus text not null default '' check(char_length(campus)<=100),
 submitted_by uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists requests_by_author on public.professor_requests(submitted_by,created_at desc);
create table if not exists public.review_entries (
 id uuid primary key default gen_random_uuid(),
 professor_id uuid not null references public.professors(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 course text not null check(char_length(trim(course)) between 2 and 100),
 period text not null check(char_length(period) between 4 and 40),
 score smallint not null check(score between 1 and 5),
 difficulty smallint not null check(difficulty between 1 and 5),
 would_take_again boolean not null,
 comment text not null check(char_length(trim(comment)) between 40 and 800),
 tags text[] not null default '{}'::text[] check(cardinality(tags)<=4),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create unique index if not exists review_once_per_course on public.review_entries(professor_id,author_id,lower(course));
create index if not exists review_by_author on public.review_entries(author_id,created_at desc);
-- La tabla pública NO contiene id del autor ni email.
create table if not exists public.public_reviews (
 review_id uuid primary key,
 professor_id uuid not null references public.professors(id) on delete cascade,
 course text not null,
 period text not null,
 score smallint not null check(score between 1 and 5),
 difficulty smallint not null check(difficulty between 1 and 5),
 would_take_again boolean not null,
 comment text not null,
 tags text[] not null default '{}'::text[],
 created_at timestamptz not null
);
create index if not exists public_review_by_professor on public.public_reviews(professor_id,created_at desc);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 review_id uuid not null references public.public_reviews(review_id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(char_length(reason) between 4 and 80),
 detail text not null default '' check(char_length(detail)<=600),
 status text not null default 'pending' check(status in ('pending','resolved','rejected')),
 created_at timestamptz not null default now(),
 unique(review_id,user_id)
);
create index if not exists reports_by_author on public.reports(user_id,created_at desc);
create or replace function private.publish_professor_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.status='approved' and old.status is distinct from 'approved' then
   insert into public.professors(id,name,university_code,university_name,campus)
   values(new.id,new.name,new.university_code,new.university_name,new.campus) on conflict do nothing;
 end if;
 return new;
end $$;
drop trigger if exists on_request_approved on public.professor_requests;
create trigger on_request_approved after update of status on public.professor_requests
for each row execute function private.publish_professor_request();
create or replace function private.sync_public_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_op='DELETE' then
  delete from public.public_reviews where review_id=old.id;return old;
 end if;
 if new.status='approved' then
  insert into public.public_reviews(review_id,professor_id,course,period,score,difficulty,would_take_again,comment,tags,created_at)
  values(new.id,new.professor_id,new.course,new.period,new.score,new.difficulty,new.would_take_again,new.comment,new.tags,new.created_at)
  on conflict(review_id) do update set course=excluded.course,period=excluded.period,score=excluded.score,
    difficulty=excluded.difficulty,would_take_again=excluded.would_take_again,comment=excluded.comment,tags=excluded.tags;
 else
  delete from public.public_reviews where review_id=new.id;
 end if;
 return new;
end $$;
drop trigger if exists on_review_publication on public.review_entries;
create trigger on_review_publication after insert or update of status or delete on public.review_entries
for each row execute function private.sync_public_review();
create or replace function private.limit_submissions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
 if tg_table_name='professor_requests' then
  select count(*) into n from public.professor_requests where submitted_by=auth.uid() and created_at>now()-interval '24 hours';
  if n>=5 then raise exception 'Límite de solicitudes por día alcanzado';end if;
 elsif tg_table_name='review_entries' then
  select count(*) into n from public.review_entries where author_id=auth.uid() and created_at>now()-interval '24 hours';
  if n>=5 then raise exception 'Límite de opiniones por día alcanzado';end if;
 elsif tg_table_name='reports' then
  select count(*) into n from public.reports where user_id=auth.uid() and created_at>now()-interval '24 hours';
  if n>=15 then raise exception 'Límite de reportes por día alcanzado';end if;
 end if;
 return new;
end $$;
drop trigger if exists limit_requests on public.professor_requests;
create trigger limit_requests before insert on public.professor_requests for each row execute function private.limit_submissions();
drop trigger if exists limit_reviews on public.review_entries;
create trigger limit_reviews before insert on public.review_entries for each row execute function private.limit_submissions();
drop trigger if exists limit_reports on public.reports;
create trigger limit_reports before insert on public.reports for each row execute function private.limit_submissions();
-- RLS
alter table public.professors enable row level security;
alter table public.professor_requests enable row level security;
alter table public.review_entries enable row level security;
alter table public.public_reviews enable row level security;
alter table public.reports enable row level security;
revoke all on public.professors,public.professor_requests,public.review_entries,public.public_reviews,public.reports from anon,authenticated;
grant select on public.professors,public.public_reviews to anon,authenticated;
grant select,insert,update on public.professor_requests,public.review_entries,public.reports to authenticated;
create policy "All read professors" on public.professors for select to anon,authenticated using(true);
create policy "All read published reviews" on public.public_reviews for select to anon,authenticated using(true);
create policy "Author or moderator views requests" on public.professor_requests for select to authenticated using(
 submitted_by=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
);
create policy "Authors submit requests pending" on public.professor_requests for insert to authenticated with check(
 submitted_by=(select auth.uid()) and status='pending'
);
create policy "Moderators update requests" on public.professor_requests for update to authenticated using(
 ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
) with check (((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator'));
create policy "Author or moderator views private reviews" on public.review_entries for select to authenticated using(
 author_id=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
);
create policy "Authors submit reviews pending" on public.review_entries for insert to authenticated with check(
 author_id=(select auth.uid()) and status='pending'
);
create policy "Moderators update reviews" on public.review_entries for update to authenticated using(
 ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
) with check (((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator'));
create policy "Author or moderator views reports" on public.reports for select to authenticated using(
 user_id=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
);
create policy "Authors submit reports pending" on public.reports for insert to authenticated with check(
 user_id=(select auth.uid()) and status='pending'
);
create policy "Moderators update reports" on public.reports for update to authenticated using(
 ((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator')
) with check (((select auth.jwt())->'app_metadata'->>'role') in ('admin','moderator'));
revoke all on schema private from public,anon,authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
