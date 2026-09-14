-- ============================================================
-- Sec F IT-I — per-account rate limits on every write
-- Run after 01–09, as one script. Idempotent.
-- ============================================================
--
-- Why here and not only at the edge: every API call reaches Supabase through
-- the bunkr.website proxy, so Supabase sees Vercel's addresses, not students'.
-- The Vercel firewall limits by real IP; this limits by account, which is the
-- only thing that still works when the whole section shares one college wifi IP.
--
-- The ceilings sit far above honest use: a month of catch-up with "Mark all
-- present" is ~90 attendance rows, and every mark also pushes the score row.
-- Hitting one returns HTTP 429 (PostgREST maps SQLSTATE PT429 to it) and the
-- app says "Slow down" instead of failing silently.


-- ---------- STEP 1 · the counter ----------
create table if not exists public.rate_limits (
  user_id      uuid        not null,
  bucket       text        not null,
  window_start timestamptz not null default now(),
  hits         int         not null default 0,
  primary key (user_id, bucket)
);
alter table public.rate_limits enable row level security;   -- no policies: nobody reads or writes it directly
revoke all on public.rate_limits from anon, authenticated;


-- ---------- STEP 2 · one hit against a fixed window ----------
-- If the limit is exceeded the exception rolls back this increment too, so the
-- counter parks at the ceiling and every further call is refused until the
-- window ends. Calls without a signed-in user (service role, SQL editor) pass.
create or replace function public.rate_hit(p_bucket text, p_max int, p_window interval)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n   int;
begin
  if uid is null then return; end if;

  insert into public.rate_limits as r (user_id, bucket, window_start, hits)
  values (uid, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update
     set hits         = case when r.window_start < now() - p_window then 1 else r.hits + 1 end,
         window_start = case when r.window_start < now() - p_window then now() else r.window_start end
  returning hits into n;

  if n > p_max then
    raise exception 'Too many changes too quickly'
      using errcode = 'PT429',
            hint    = 'Wait a few minutes and try again.';
  end if;
end;
$$;
revoke all on function public.rate_hit(text, int, interval) from public, anon, authenticated;


-- ---------- STEP 3 · one trigger function, limits passed per table ----------
create or replace function public.rate_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rate_hit(tg_argv[0], tg_argv[1]::int, tg_argv[2]::interval);
  return coalesce(new, old);
end;
$$;
revoke all on function public.rate_guard() from public, anon, authenticated;


-- ---------- STEP 4 · attach to every table the app writes ----------
-- bucket, max rows changed, per window
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('attendance',      'attendance', 1500, '10 minutes'),   -- marks, catch-up, clear all
      ('students',        'students',    300, '10 minutes'),   -- score push per mark, profile, device, claim
      ('cancellations',   'reports',      40, '1 hour'),       -- cancelled-class reports
      ('notices',         'notices',      60, '1 hour'),       -- CR notices
      ('class_overrides', 'cr_edits',    150, '1 hour'),       -- CR class changes
      ('cr_holidays',     'cr_edits',    150, '1 hour'),
      ('term',            'cr_term',      30, '1 hour')
    ) as v(tbl, bucket, max_hits, win)
  loop
    if to_regclass('public.' || t.tbl) is null then continue; end if;
    execute format('drop trigger if exists rate_limit on public.%I', t.tbl);
    execute format(
      'create trigger rate_limit before insert or update or delete on public.%I
         for each row execute function public.rate_guard(%L, %L, %L)',
      t.tbl, t.bucket, t.max_hits::text, t.win);
  end loop;
end $$;


-- ---------- STEP 5 · keep the counter table small ----------
-- Old windows are dead weight. Safe to run any time; pg_cron can run it daily.
delete from public.rate_limits where window_start < now() - interval '1 day';
