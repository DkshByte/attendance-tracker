-- ============================================================
-- Bunkr — "What's new", posted from the dashboard
-- Run AFTER 01–11, as one script. It is idempotent.
--
-- The app shows the newest row once to every returning student
-- (a new account gets the welcome tour instead). To announce a
-- major feature, insert a row with a new id in the Table Editor
-- or the SQL editor — no deploy, no APK:
--
--   insert into public.announcements (id, items) values
--   ('2026-10-something', '[
--     {"title": "Short headline", "body": "One line on what changed."}
--   ]');
--
-- Small fixes get no row; a popup for every fix gets tapped away
-- unread.
-- ============================================================


-- ---------- STEP 1 · the table ----------

create table if not exists public.announcements (
  id         text primary key,
  items      jsonb not null check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now()
);


-- ---------- STEP 2 · who may do what ----------
-- Everyone reads, signed in or not: it is the app's own changelog.
-- No write policy at all, so only the dashboard (service role) can
-- post one — not a CR, not the publishable key.

alter table public.announcements enable row level security;

drop policy if exists "anyone reads" on public.announcements;
create policy "anyone reads" on public.announcements
  for select using (true);


-- ---------- STEP 3 · the announcement the app already shipped ----------
-- Same id as the build that had it written in, so a student who has
-- already tapped it away is not shown it a second time.

insert into public.announcements (id, items) values
('2026-09-arranged', '[
  {"title": "Arranged classes count for your subject",
   "body": "If Physics is arranged to Mechanics, the class still counts for Physics."},
  {"title": "Privacy, Terms and Delete account",
   "body": "All three now live in Your profile."}
]')
on conflict (id) do nothing;
