-- ============================================================
-- Sec F IT-I — leaderboard backend
-- Run these ONE STEP AT A TIME in Supabase → SQL Editor.
-- Clear the box between steps. If a step errors, stop and send
-- me the error — we'll know exactly which one broke.
-- ============================================================


-- ---------- STEP 0 · is the editor even working? ----------
-- Expect: one row with the current time.

select now();


-- ---------- STEP 1 · the table ----------
-- Expect: "Success. No rows returned."

create table if not exists public.leaderboard (
  -- no foreign key to auth.users: this project denies DDL against the
  -- auth schema. Ownership is enforced by the policies in STEP 2, which
  -- compare auth.uid() to this column, so security is unchanged.
  id         uuid primary key,
  name       text not null,
  username   text not null unique,
  present    int  not null default 0,
  held       int  not null default 0,
  updated_at timestamptz not null default now()
);


-- ---------- STEP 2 · lock it down ----------
-- A device may read and write its own row and no other.
-- Expect: "Success. No rows returned."

alter table public.leaderboard enable row level security;

drop policy if exists "read own row"   on public.leaderboard;
drop policy if exists "insert own row" on public.leaderboard;
drop policy if exists "update own row" on public.leaderboard;
drop policy if exists "delete own row" on public.leaderboard;

create policy "read own row"   on public.leaderboard
  for select using (auth.uid() = id);

create policy "insert own row" on public.leaderboard
  for insert with check (auth.uid() = id);

create policy "update own row" on public.leaderboard
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- so anyone can take themselves off the board again
create policy "delete own row" on public.leaderboard
  for delete using (auth.uid() = id);

-- Table privileges. Policies alone are not enough: a role must also hold
-- the grant. Only "authenticated" gets one, so an anonymous reader cannot
-- touch this table at all and reads the ranks view instead.
grant select, insert, update, delete on public.leaderboard to authenticated;


-- ---------- STEP 3 · (removed) ----------
-- This file used to redefine public.leaderboard_ranks over the table above.
-- 01 already defines that view over public.students, and 01's is the one the
-- app uses: it selects `batch`, which the version here did not have. Because
-- this file's number is higher it ran last and broke the leaderboard with a
-- 400 for every student. The view now lives in 01 only.
--
-- public.leaderboard is consequently unused. Nothing reads or writes it; the
-- totals live on public.students. Drop it once you have checked it is empty.


-- ---------- STEP 4 · prove it worked ----------
-- Expect: TWO rows — leaderboard (BASE TABLE) and
--         leaderboard_ranks (VIEW). If you see them, you're done.

select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('leaderboard', 'leaderboard_ranks')
order by table_name;
