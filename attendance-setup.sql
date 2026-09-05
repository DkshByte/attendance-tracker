-- ============================================================
-- Sec F IT-I — attendance in the cloud
-- Run these ONE STEP AT A TIME in Supabase → SQL Editor.
-- Clear the box between steps. If a step errors, stop and send
-- me the error — we'll know exactly which one broke.
--
-- What this is for: the marks are hand-entered over a whole term
-- and cannot be recreated. Today they live in one browser and die
-- with it. This keeps a copy the student owns, so a new phone, a
-- cleared browser or a second device still has the term.
--
-- What it is NOT for: the app still reads localStorage to draw a
-- page. The cloud is a copy, not the source of truth, so the app
-- keeps working with no signal.
-- ============================================================


-- ---------- STEP 0 · is the editor even working? ----------
-- Expect: one row with the current time.

select now();


-- ---------- STEP 1 · the table ----------
-- One row per marked class. The key is the date plus the slot —
-- the class's position in that weekday's list, 0-6 — which is
-- exactly how the app already keys a mark on the device.
--
-- user_id defaults to auth.uid(), so the app never sends it and
-- cannot get it wrong. mark is P (present), A (absent) or C (off,
-- excluded from the percentage entirely).
-- Expect: "Success. No rows returned."

create table if not exists public.attendance (
  user_id    uuid not null default auth.uid(),
  on_date    date not null,
  slot       int  not null check (slot between 0 and 6),
  mark       char(1) not null check (mark in ('P','A','C')),
  subject    text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, on_date, slot)
);


-- ---------- STEP 2 · lock it down ----------
-- A student may read and write their own marks and nobody else's.
-- Not even the CR, and not the leaderboard: the board reads the
-- present/held totals on public.students, never this table.
-- Expect: "Success. No rows returned."

alter table public.attendance enable row level security;

drop policy if exists "read own marks"   on public.attendance;
drop policy if exists "write own marks"  on public.attendance;
drop policy if exists "update own marks" on public.attendance;
drop policy if exists "delete own marks" on public.attendance;

create policy "read own marks"   on public.attendance
  for select using (auth.uid() = user_id);

create policy "write own marks"  on public.attendance
  for insert with check (auth.uid() = user_id);

create policy "update own marks" on public.attendance
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- unmarking a class has to reach the cloud too, or it comes back
create policy "delete own marks" on public.attendance
  for delete using (auth.uid() = user_id);

-- Policies alone are not enough: a role must also hold the grant.
-- Only "authenticated" gets one, so the publishable key on its own
-- reads nothing here.
grant select, insert, update, delete on public.attendance to authenticated;

revoke all on public.attendance from anon;


-- ---------- STEP 3 · keep updated_at honest ----------
-- Two devices offline at once both write; the newer write wins.
-- That tiebreak is only as good as the timestamp, so the server
-- stamps it rather than trusting whatever the phone's clock says.
-- Expect: "Success. No rows returned."

create or replace function public.touch_attendance()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists attendance_touch on public.attendance;

create trigger attendance_touch
  before insert or update on public.attendance
  for each row execute function public.touch_attendance();


-- ---------- STEP 4 · check it works ----------
-- Run this while signed in as a student from the app (not from the
-- SQL editor, which runs as the owner and bypasses RLS).
-- Expect: only your own rows, however many you have marked.

-- select on_date, slot, mark, subject, updated_at
--   from public.attendance order by on_date desc, slot limit 20;


-- ---------- Size, for the record ----------
-- ~430 classes a term per student. Sixty students is ~26,000 rows,
-- a few megabytes. The free tier holds 500MB.


-- ---------- STEP 5 · make "clear records" stick across devices ----------
-- Without this, clearing on one phone is undone by the next one that syncs:
-- an empty cloud is indistinguishable from "the cloud has not seen my marks
-- yet", so the other device helpfully uploads them all again.
--
-- One timestamp fixes it. Clearing stamps it; every device drops the records
-- it holds from before that moment. Lives on the student's own row, which
-- already has an update policy and a grant.
-- Expect: "Success. No rows returned."

alter table public.students
  add column if not exists attendance_cleared_at timestamptz;
