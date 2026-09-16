-- ============================================================
-- Bunkr — the leaderboard becomes opt-in
-- Run AFTER 01–10, as one script. It is idempotent: running it
-- twice changes nothing, and never reverses somebody's opt-out.
--
-- Attendance is socially sensitive. "My class can see how much I
-- bunk" is the one thing that makes a student uninstall, and the
-- board was on for everyone the moment they marked a class. It now
-- shows only the students who asked to be on it.
--
-- Everyone who had already claimed a name keeps their place — the
-- column is added true, then its default flips to false — so nobody
-- wakes up to a board that emptied overnight, and every new claim
-- starts hidden. The app writes it from the Board switch in the
-- profile. To make it a clean opt-in for existing students too:
--   update public.students set on_leaderboard = false;
-- ============================================================


-- ---------- STEP 1 · the column ----------
-- Added true so today's students keep their rank; the default then
-- flips to false so every new claim starts hidden. `if not exists`
-- is what makes a re-run harmless: on a second pass the column is
-- already there, so nobody's false is quietly turned back to true.

alter table public.students
  add column if not exists on_leaderboard boolean not null default true;

alter table public.students
  alter column on_leaderboard set default false;

-- STEP 1 gave the 60 seeded roster rows true along with everyone
-- else, and those belong to nobody yet — on a fresh database that
-- would hand the first claimant a visible row and quietly undo the
-- opt-in. An unclaimed row has no one to grandfather, so clear it.

update public.students
   set on_leaderboard = false
 where claimed_by is null and on_leaderboard;


-- ---------- STEP 2 · let a student write their own switch ----------
-- 06 STEP 1 revoked the table-wide update and granted nine columns
-- by name; column grants are additive, so this is the tenth. RLS
-- still limits it to the row the caller claimed.

grant update (on_leaderboard) on public.students to authenticated;


-- ---------- STEP 3 · the board reads the switch ----------
-- The filter goes in the WHERE, before rank(), so positions close up
-- over the students who are showing. Ranking first and filtering
-- after would leave gaps, and a gap is itself a leak: it tells the
-- section that somebody above you is hiding.
--
-- Otherwise identical to 06 STEP 3's version, which is the live one.

drop view if exists public.leaderboard_ranks;

create view public.leaderboard_ranks as
  select
    name, username, batch,
    rank() over (
      order by (present::numeric / nullif(held, 0)) desc nulls last, held desc
    ) as rank
  from public.students
  where held > 0 and claimed_by is not null and on_leaderboard;

grant select on public.leaderboard_ranks to anon, authenticated;


-- ---------- STEP 4 · a released row goes back to hidden ----------
-- cr_release hands a name back to the list and clears the contacts
-- with it. It has to clear this too, or the next student to claim
-- that name inherits the last one's visible board row without ever
-- being asked. Same body as 05, one column longer.

create or replace function public.cr_release(p_sno int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_cr() then
    raise exception 'only the CR can do that' using errcode = '42501';
  end if;
  update public.students
     set claimed_by = null, claimed_at = null, username = null,
         github = null, linkedin = null, instagram = null, mobile = null, email = null,
         on_leaderboard = false
   where sno = p_sno;
end;
$$;

revoke all on function public.cr_release(int) from public, anon;
grant execute on function public.cr_release(int) to authenticated;


-- ---------- STEP 5 · prove it ----------
-- Expect: default false, on_leaderboard among the update grants, and
-- a board that counts only the students who are showing.

select column_default from information_schema.columns
 where table_schema = 'public' and table_name = 'students'
   and column_name = 'on_leaderboard';

select string_agg(column_name, ', ' order by column_name) as update_columns
  from information_schema.column_privileges
 where grantee = 'authenticated'
   and table_schema = 'public' and table_name = 'students'
   and privilege_type = 'UPDATE';

select
  (select count(*) from public.students where claimed_by is not null and on_leaderboard) as showing,
  (select count(*) from public.students where claimed_by is not null and not on_leaderboard) as hidden,
  (select count(*) from public.leaderboard_ranks) as on_board;
