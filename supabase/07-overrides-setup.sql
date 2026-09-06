-- ============================================================
-- Sec F IT-I — what the CR says actually happened
--
-- public.cancellations (05) is a vote: three students report a
-- class off and it counts as off. That is the right default when
-- nobody is in charge. This table is the other case — the CR
-- knows, and does not need three people to agree with them.
--
-- One row per period per day, so there is no "which override
-- wins" question to get wrong. The CR writes; everyone reads.
-- ============================================================


-- ---------- STEP 1 · the table ----------

create table if not exists public.class_overrides (
  on_date date not null,
  period  int  not null check (period between 0 and 6),

  -- 'off'  — the class did not run; it counts against nobody.
  -- 'swap' — a different subject ran in this slot; marks for the
  --          period count towards `subject` instead.
  kind    text not null check (kind in ('off','swap')),

  -- The app's own subject key (PPS, BEELAB, PHL…). Deliberately not
  -- a foreign key: the timetable lives in the HTML, not in Postgres,
  -- and a FK here would mean a migration every time a subject is
  -- renamed. The app ignores a key it does not know.
  subject text,
  note    text,

  by_user uuid not null,
  at      timestamptz not null default now(),

  primary key (on_date, period),

  -- A swap with no subject is not a swap, it is a broken row.
  constraint swap_needs_subject
    check (kind <> 'swap' or coalesce(trim(subject), '') <> '')
);


-- ---------- STEP 2 · who may do what ----------

alter table public.class_overrides enable row level security;

drop policy if exists "section reads"  on public.class_overrides;
drop policy if exists "cr writes"      on public.class_overrides;
drop policy if exists "cr edits"       on public.class_overrides;
drop policy if exists "cr withdraws"   on public.class_overrides;

-- Everyone signed in sees the verdict. Not granted to anon: the note is
-- free text written by a student, and the publishable key is public.
create policy "section reads" on public.class_overrides
  for select using (auth.uid() is not null);

-- is_cr() is security definer (05), so it reads the role even though the
-- caller cannot see other students' rows. by_user is pinned to the caller
-- so a CR cannot post one of these under someone else's name.
create policy "cr writes" on public.class_overrides
  for insert with check (public.is_cr() and by_user = auth.uid());

create policy "cr edits" on public.class_overrides
  for update using (public.is_cr()) with check (public.is_cr() and by_user = auth.uid());

create policy "cr withdraws" on public.class_overrides
  for delete using (public.is_cr());

revoke all on public.class_overrides from anon;
grant select, insert, update, delete on public.class_overrides to authenticated;


-- ---------- STEP 3 · reading it back ----------
-- The app asks for one date window at a time.

create index if not exists class_overrides_on_date_idx
  on public.class_overrides (on_date);
