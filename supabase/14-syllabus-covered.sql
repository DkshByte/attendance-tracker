-- ============================================================
-- Bunkr — what the class has covered, marked by the CR
-- Run AFTER 01–13, as one script. It is idempotent.
--
-- Replaces the per-student ticks of 13: "how far has the class got"
-- is one fact about the section, so it is one row per topic, written
-- by the CR and read by everyone. 13's syllabus_progress table is no
-- longer used by the app; drop it whenever you like:
--   drop table if exists public.syllabus_progress;
-- ============================================================


-- ---------- STEP 1 · the table ----------
-- topic is the app's own id: SUBJECT.unit.index, e.g. PHL.1.12.
-- An uncovered topic is kept as covered = false rather than deleted,
-- so undoing a tick is the same upsert as making one.

create table if not exists public.syllabus_covered (
  topic   text primary key check (topic ~ '^[A-Z]+\.[0-3]\.[0-9]{1,2}$'),
  covered boolean not null,
  by_user uuid not null,
  at      timestamptz not null default now()
);


-- ---------- STEP 2 · everyone reads, only the CR writes ----------
-- Read by anon too, like the CR's holidays: which topics the class has
-- reached is not private, and a signed-out classmate should see it.
-- is_cr() is security definer (05). by_user is pinned to the caller.

alter table public.syllabus_covered enable row level security;

drop policy if exists "anyone reads"  on public.syllabus_covered;
drop policy if exists "cr marks"      on public.syllabus_covered;
drop policy if exists "cr changes"    on public.syllabus_covered;

create policy "anyone reads" on public.syllabus_covered
  for select using (true);
create policy "cr marks" on public.syllabus_covered
  for insert with check (public.is_cr() and by_user = auth.uid());
create policy "cr changes" on public.syllabus_covered
  for update using (public.is_cr()) with check (public.is_cr() and by_user = auth.uid());

-- Policies alone are not enough: this project holds no default grants.
grant select on public.syllabus_covered to anon, authenticated;
grant insert, update on public.syllabus_covered to authenticated;


-- ---------- STEP 3 · the write limit every CR table has (10) ----------
-- Catching up a term is a few hundred topics, so this gets its own
-- bucket rather than sharing cr_edits' 150 an hour.

do $$
begin
  if to_regprocedure('public.rate_guard()') is not null then
    drop trigger if exists rate_limit on public.syllabus_covered;
    create trigger rate_limit before insert or update on public.syllabus_covered
      for each row execute function public.rate_guard('cr_syllabus', '800', '1 hour');
  end if;
end $$;
