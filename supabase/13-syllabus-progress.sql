-- ============================================================
-- Bunkr — syllabus progress, synced like attendance
-- Run AFTER 01–12, as one script. It is idempotent.
--
-- One row per topic a student has touched. An untick is kept as
-- done = false rather than deleted, so a second phone still holding
-- the old tick cannot push it straight back — the newer write wins,
-- exactly as attendance merges.
-- ============================================================


-- ---------- STEP 1 · the table ----------
-- topic is the app's own id: SUBJECT.unit.index, e.g. PHL.1.12

create table if not exists public.syllabus_progress (
  user_id    uuid not null default auth.uid(),
  topic      text not null check (topic ~ '^[A-Z]+\.[0-3]\.[0-9]{1,2}$'),
  done       boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);


-- ---------- STEP 2 · each student sees and writes only their own ----------

alter table public.syllabus_progress enable row level security;

drop policy if exists "read own progress"   on public.syllabus_progress;
drop policy if exists "write own progress"  on public.syllabus_progress;
drop policy if exists "update own progress" on public.syllabus_progress;

create policy "read own progress"   on public.syllabus_progress
  for select using (auth.uid() = user_id);
create policy "write own progress"  on public.syllabus_progress
  for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.syllabus_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies alone are not enough: this project holds no default grants.
grant select, insert, update on public.syllabus_progress to authenticated;
revoke all on public.syllabus_progress from anon;


-- ---------- STEP 3 · the same write limit every other table has (10) ----------
-- "Mark unit done" on a long unit is ~17 rows; a whole subject ~60.

do $$
begin
  if to_regprocedure('public.rate_guard()') is not null then
    drop trigger if exists rate_limit on public.syllabus_progress;
    create trigger rate_limit before insert or update on public.syllabus_progress
      for each row execute function public.rate_guard('syllabus', '600', '10 minutes');
  end if;
end $$;
