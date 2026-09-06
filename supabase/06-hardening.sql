-- ============================================================
-- Bunkr — security hardening
-- Run this AFTER 01–05, as one script. It is idempotent: running
-- it twice changes nothing. It fixes four real holes found in a
-- pre-production audit.
--
-- Nothing here changes what the app sends, so no client rebuild
-- is required — except that 04's leaderboard_ranks is replaced
-- (see STEP 3; the app has always wanted 01's version).
-- ============================================================


-- ---------- STEP 1 · stop students promoting themselves to CR ----------
-- THE CRITICAL ONE.
--
-- 01 did `grant select, update on public.students to authenticated`.
-- RLS is row-level, not column-level: "update own row" lets a student
-- write ANY column of their own row, and PostgREST will happily PATCH
-- one. So `PATCH /rest/v1/students?sno=eq.<mine> {"role":"cr"}` made
-- any student a CR — and a CR can call cr_release() to unclaim any
-- classmate and wipe their contacts.
--
-- The fix is a column grant. RLS still says which ROW; this says
-- which COLUMNS. The list is exactly what the app writes: totals,
-- the clear-stamp, and the five opt-in contact fields.
--
-- name, batch, sno, username, role, claimed_by, claimed_at and the
-- active_device_* columns are now unwritable from a token. Every
-- legitimate path to them (claim_student, claim_device, check_device,
-- release_device, cr_*) is SECURITY DEFINER and runs as the owner,
-- so none of them are affected.

revoke update on public.students from authenticated;

grant update (
  present, held, updated_at, attendance_cleared_at,
  github, linkedin, instagram, mobile, email
) on public.students to authenticated;

-- select stays table-wide: RLS already limits it to the caller's own row.
grant select on public.students to authenticated;


-- ---------- STEP 2 · the directory is for the section, not the internet ----------
-- 05 granted `directory` to `authenticated`, and a view runs as its
-- OWNER, so it bypasses RLS. Sign-up is open: anyone on the internet
-- could create an account with any email and read all 60 students'
-- phone numbers and personal emails.
--
-- Rebuilt with the obvious gate: you see the section only once you
-- are IN the section, i.e. once you have claimed a roster row.
-- An account that has signed up but not claimed a name gets zero
-- rows, which the app already handles (it falls back to names-only,
-- the same thing it shows a signed-out visitor).

drop view if exists public.directory;

create view public.directory as
  select s.sno, s.name, s.batch, s.username, s.role,
         s.github, s.linkedin, s.instagram, s.mobile, s.email
  from public.students s
  where s.claimed_by is not null
    and exists (
      select 1 from public.students me
       where me.claimed_by = auth.uid()
    );

revoke all on public.directory from anon, public;
grant select on public.directory to authenticated;


-- ---------- STEP 3 · one leaderboard_ranks, not two ----------
-- 01 and 04 both create a view by this name, over different tables,
-- and they are incompatible. 04 runs last by its number and wins —
-- but 04's version has no `batch` column, and the app asks for
-- `select=name,username,batch,rank`. Run the files in their stated
-- order and the leaderboard returns a 400 for everyone.
--
-- 01's version is the live one: it reads present/held off the roster
-- row, which is what the app actually writes. public.leaderboard
-- (04's table) is dead weight; drop it once you have confirmed it is
-- empty — the commented-out line at the bottom of this step.

drop view if exists public.leaderboard_ranks;

create view public.leaderboard_ranks as
  select
    name, username, batch,
    rank() over (
      order by (present::numeric / nullif(held, 0)) desc nulls last, held desc
    ) as rank
  from public.students
  where held > 0 and claimed_by is not null;

grant select on public.leaderboard_ranks to anon, authenticated;

-- Percentages never leave the database; only the ordering does. Names
-- and usernames are already public through `roster`, which the
-- pick-your-name screen needs before anyone can sign in.

-- After checking `select count(*) from public.leaderboard;` is 0:
-- drop table if exists public.leaderboard;


-- ---------- STEP 4 · a username the database believes in ----------
-- claim_student validates the format, but nothing else did, and the
-- column was reachable by a raw PATCH until STEP 1. Belt and braces,
-- and it costs nothing.

alter table public.students
  drop constraint if exists students_username_fmt;

alter table public.students
  add constraint students_username_fmt
  check (username is null or username ~ '^[a-z0-9_]{3,16}$');


-- ---------- STEP 5 · a cancellation is always your own ----------
-- The insert policy already refuses a by_user that is not you. This
-- just means the app cannot get it wrong in the first place.

alter table public.cancellations
  alter column by_user set default auth.uid();


-- ---------- STEP 6 · prove it ----------
-- Expect: update_columns lists exactly the nine from STEP 1, and
-- leaderboard_ranks has a `batch` column.

select string_agg(column_name, ', ' order by column_name) as update_columns
  from information_schema.column_privileges
 where grantee = 'authenticated'
   and table_schema = 'public' and table_name = 'students'
   and privilege_type = 'UPDATE';

select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'leaderboard_ranks'
 order by ordinal_position;
