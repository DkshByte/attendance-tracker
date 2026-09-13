-- ============================================================
-- Sec F IT-I — the CR runs the calendar
--
-- The closures and the last teaching day used to live only in the
-- HTML, so changing either meant a release. These two tables let
-- the CR change them for the whole section from the CR page.
-- Run after 01–07, as one script. Idempotent.
-- ============================================================


-- ---------- STEP 1 · holidays the CR declares ----------
-- 'closed' — no classes that day; the day leaves everyone's maths,
--            including marks already made on it.
-- 'open'   — classes ran on a day the built-in list calls a closure.
-- One row per date, so there is no "which one wins" to get wrong.

create table if not exists public.cr_holidays (
  on_date date primary key,
  kind    text not null check (kind in ('closed','open')),
  name    text not null check (length(trim(name)) between 1 and 60),
  by_user uuid not null default auth.uid(),
  at      timestamptz not null default now()
);

alter table public.cr_holidays enable row level security;

drop policy if exists "anyone reads" on public.cr_holidays;
drop policy if exists "cr writes"    on public.cr_holidays;
drop policy if exists "cr edits"     on public.cr_holidays;
drop policy if exists "cr withdraws" on public.cr_holidays;

-- Readable signed out too: a closure changes the budget maths, and a
-- signed-out student's numbers must not disagree with a signed-in one's.
create policy "anyone reads" on public.cr_holidays
  for select using (true);

create policy "cr writes" on public.cr_holidays
  for insert with check (public.is_cr() and by_user = auth.uid());

create policy "cr edits" on public.cr_holidays
  for update using (public.is_cr()) with check (public.is_cr() and by_user = auth.uid());

create policy "cr withdraws" on public.cr_holidays
  for delete using (public.is_cr());

revoke all on public.cr_holidays from anon;
grant select on public.cr_holidays to anon;
grant select, insert, update, delete on public.cr_holidays to authenticated;


-- ---------- STEP 2 · the term ----------
-- Exactly one row (id is always true). No delete: a term always ends.

create table if not exists public.term (
  id      boolean primary key default true check (id),
  sem_end date not null check (sem_end >= date '2026-08-17'),
  by_user uuid not null default auth.uid(),
  at      timestamptz not null default now()
);

alter table public.term enable row level security;

drop policy if exists "anyone reads" on public.term;
drop policy if exists "cr writes"    on public.term;
drop policy if exists "cr edits"     on public.term;

create policy "anyone reads" on public.term
  for select using (true);

create policy "cr writes" on public.term
  for insert with check (public.is_cr() and by_user = auth.uid());

create policy "cr edits" on public.term
  for update using (public.is_cr()) with check (public.is_cr() and by_user = auth.uid());

revoke all on public.term from anon;
grant select on public.term to anon;
grant select, insert, update on public.term to authenticated;


-- ---------- STEP 3 · check ----------

select
  (select count(*) from public.cr_holidays) as cr_holidays,
  (select sem_end from public.term)         as sem_end;
