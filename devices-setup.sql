-- ============================================================
-- Sec F IT-I — Single Device Session Management
-- Run this in your Supabase SQL Editor.
--
-- Model: Only one device is active per student account at a time.
-- If signed in on Device A and student signs in on Device B:
-- Device B prompts whether to kick Device A.
-- When confirmed, Device A's session is evicted.
-- ============================================================

-- ---------- STEP 1 · Add active device columns ----------
alter table public.students
  add column if not exists active_device_id   text,
  add column if not exists active_device_name text,
  add column if not exists active_device_at   timestamptz;

-- ---------- STEP 2 · Claim device function ----------
create or replace function public.claim_device(p_device_id text, p_device_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  update public.students
     set active_device_id   = p_device_id,
         active_device_name = coalesce(trim(p_device_name), 'Unknown device'),
         active_device_at   = now()
   where claimed_by = auth.uid();
end;
$$;

-- ---------- STEP 3 · Check device function (heartbeat & eviction check) ----------
create or replace function public.check_device(p_device_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dev_id   text;
  v_dev_name text;
  v_dev_at   timestamptz;
begin
  if auth.uid() is null then
    return json_build_object('valid', false, 'reason', 'unauthenticated');
  end if;

  select active_device_id, active_device_name, active_device_at
    into v_dev_id, v_dev_name, v_dev_at
    from public.students
   where claimed_by = auth.uid();

  -- If no device has claimed it yet, or matches this device
  if v_dev_id is null or v_dev_id = p_device_id then
    update public.students
       set active_device_at = now()
     where claimed_by = auth.uid()
       and active_device_id = p_device_id;
    return json_build_object('valid', true);
  end if;

  return json_build_object(
    'valid', false,
    'other_device', coalesce(v_dev_name, 'Another device'),
    'last_active', v_dev_at
  );
end;
$$;

-- ---------- STEP 4 · Release device on normal sign-out ----------
create or replace function public.release_device(p_device_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;

  update public.students
     set active_device_id   = null,
         active_device_name = null
   where claimed_by = auth.uid()
     and (p_device_id is null or active_device_id = p_device_id);
end;
$$;

-- ---------- STEP 5 · Permissions ----------
revoke all on function public.claim_device(text, text) from public, anon;
revoke all on function public.check_device(text)       from public, anon;
revoke all on function public.release_device(text)     from public, anon;

grant execute on function public.claim_device(text, text) to authenticated;
grant execute on function public.check_device(text)       to authenticated;
grant execute on function public.release_device(text)     to authenticated;
