-- ============================================================
-- Bunkr — enrolment numbers, each one readable by its own student only
-- Run AFTER 01–14, as one script. It is idempotent.
--
-- THE NUMBERS ARE NOT IN THIS FILE, and must never be: this repo is
-- public, and so is everything under deploy/. They go in through a
-- separate data script run by hand in the SQL editor (STEP 3), kept
-- off GitHub. .gitignore and check.py both refuse one committed here.
--
-- The app asks for the column with the profile and quietly does
-- without it until this has run, so the order you deploy in does not
-- matter.
-- ============================================================


-- ---------- STEP 1 · the column ----------
-- The university's 11 digits, leading zero kept: 05515603126 is roll
-- 055, college 156, branch 031, batch of 26. Text, not a number, or
-- the zero goes (a spreadsheet already dropped it once). It belongs
-- to the roster row, not the account, so a released claim leaves it
-- where it is for whoever claims that name properly.

alter table public.students add column if not exists enrolment text;

alter table public.students drop constraint if exists students_enrolment_fmt;
alter table public.students add constraint students_enrolment_fmt
  check (enrolment is null or enrolment ~ '^[0-9]{11}$');

alter table public.students drop constraint if exists students_enrolment_key;
alter table public.students add constraint students_enrolment_key unique (enrolment);


-- ---------- STEP 2 · who can read it: you ----------
-- Nothing to grant, and that is the point. Every road to this column
-- is already shut except the one to your own row:
--   * "read own row" (01) is the only select policy on students, so a
--     token reads its own claimed row and nothing else;
--   * roster, directory and leaderboard_ranks each name their columns,
--     so a new column is in none of them (STEP 4 proves it);
--   * update is a column grant (06, 11) that does not list it, so a
--     student cannot change theirs, or put someone else's on their row.
-- If you ever write a view over students, name its columns. select *
-- would hand every student's number to the section.


-- ---------- STEP 3 · load the numbers ----------
-- Paste and run the private data script you were given
-- (sec-f-enrolment-data.sql). It matches on the student's name, and
-- only where that name is on exactly one row, so a renamed or added
-- row is left alone rather than handed someone else's number.


-- ---------- STEP 4 · prove it ----------
-- Expect: zero rows from the first query (no view exposes the column),
-- one select policy on students, "read own row", and enrolment NOT
-- among the update columns.

select view_name as view_exposing_enrolment
  from information_schema.view_column_usage
 where table_schema = 'public' and table_name = 'students' and column_name = 'enrolment';

select policyname, cmd, qual
  from pg_policies
 where schemaname = 'public' and tablename = 'students' and cmd in ('SELECT', 'ALL');

select string_agg(column_name, ', ' order by column_name) as update_columns
  from information_schema.column_privileges
 where grantee = 'authenticated'
   and table_schema = 'public' and table_name = 'students'
   and privilege_type = 'UPDATE';

-- and, once STEP 3 has run, how many have a number
select count(*) filter (where enrolment is not null) as with_enrolment,
       count(*) filter (where enrolment is null)     as without
  from public.students;
