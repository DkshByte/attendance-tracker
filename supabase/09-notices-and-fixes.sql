-- ============================================================
-- Sec F IT-I — notices, CR handover, and two data fixes
-- Run after 01–08, as one script. Idempotent.
-- ============================================================


-- ---------- STEP 1 · a cleared mark is a row, not a hole ----------
-- Deleting the row made "cleared on my phone" look exactly like
-- "never uploaded" to every other device, which uploaded the old
-- mark straight back. The app now writes mark 'X' instead.

do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.attendance'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%mark%'
  loop
    execute format('alter table public.attendance drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.attendance
  add constraint attendance_mark_check check (mark in ('P','A','C','X'));


-- ---------- STEP 2 · totals that cannot be absurd ----------
-- present/held are written by the app, so any student can PATCH
-- their own. Self-marked attendance can never be cheat-proof, but
-- 999 of 999 should not be accepted. NOT VALID: existing rows are
-- left alone; every new write is checked.

alter table public.students drop constraint if exists students_totals_sane;
alter table public.students
  add constraint students_totals_sane
  check (present >= 0 and present <= held and held <= 600) not valid;


-- ---------- STEP 3 · notices from the CR ----------
-- Shown on Today for everyone signed in until `until`.

create table if not exists public.notices (
  id      bigint generated always as identity primary key,
  body    text not null check (length(trim(body)) between 1 and 280),
  until   date not null,
  by_user uuid not null default auth.uid(),
  at      timestamptz not null default now()
);

alter table public.notices enable row level security;

drop policy if exists "section reads" on public.notices;
drop policy if exists "cr writes"     on public.notices;
drop policy if exists "cr withdraws"  on public.notices;

-- Signed in only: free text, and the publishable key is public.
create policy "section reads" on public.notices
  for select using (auth.uid() is not null);

create policy "cr writes" on public.notices
  for insert with check (public.is_cr() and by_user = auth.uid());

create policy "cr withdraws" on public.notices
  for delete using (public.is_cr());

revoke all on public.notices from anon;
grant select, insert, delete on public.notices to authenticated;


-- ---------- STEP 4 · the CR can hand the role on ----------
-- Refuses anyone who is not a CR, and refuses removing the last CR,
-- so the section can never be left with nobody able to run it.

create or replace function public.cr_set_role(p_sno int, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_cr() then
    raise exception 'only the CR can do that' using errcode = '42501';
  end if;
  if p_role not in ('student','cr') then
    raise exception 'role must be student or cr' using errcode = '22023';
  end if;
  if p_role = 'student'
     and (select count(*) from public.students where role = 'cr' and sno <> p_sno) = 0 then
    raise exception 'make someone else CR first' using errcode = '22023';
  end if;
  update public.students set role = p_role where sno = p_sno;
end;
$$;

revoke all on function public.cr_set_role(int, text) from public, anon;
grant execute on function public.cr_set_role(int, text) to authenticated;


-- ---------- STEP 5 · check ----------

notify pgrst, 'reload schema';

select
  (select count(*) from public.notices)                   as notices,
  (select count(*) from public.students where role = 'cr') as crs;
