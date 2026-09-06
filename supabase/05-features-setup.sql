-- ============================================================
-- Sec F IT-I — CR role, contacts, cancelled classes
-- Run as one script (it is short) or step by step.
--
-- The bunk planner is not here on purpose: it is what-if maths
-- over data already on the device, so it needs no server.
-- ============================================================


-- ---------- STEP 1 · new columns ----------
-- Contacts are opt-in. Blank means not shared; there is no
-- "private" flag to get wrong.

alter table public.students
  add column if not exists role      text not null default 'student'
                                     check (role in ('student','cr')),
  add column if not exists github    text,
  add column if not exists linkedin  text,
  add column if not exists instagram text,
  add column if not exists mobile    text,
  add column if not exists email     text;


-- ---------- STEP 2 · the section directory ----------
-- Signed-in students only. Never granted to anon, because the
-- publishable key is public and this holds phone numbers.

drop view if exists public.directory;

create view public.directory as
  select sno, name, batch, username, role,
         github, linkedin, instagram, mobile, email
  from public.students
  where claimed_by is not null;

revoke all on public.directory from anon;
grant select on public.directory to authenticated;


-- ---------- STEP 3 · cancelled classes ----------
-- One row per student per cancelled period. Confirmation is just
-- the row count, so nobody can cancel a class on their own.

create table if not exists public.cancellations (
  on_date  date not null,
  period   int  not null check (period between 0 and 6),
  by_user  uuid not null,
  at       timestamptz not null default now(),
  primary key (on_date, period, by_user)
);

alter table public.cancellations enable row level security;

drop policy if exists "report own"   on public.cancellations;
drop policy if exists "withdraw own" on public.cancellations;

create policy "report own" on public.cancellations
  for insert with check (auth.uid() = by_user);

create policy "withdraw own" on public.cancellations
  for delete using (auth.uid() = by_user);

-- you can see your own report so the app can offer to take it back
create policy "read own reports" on public.cancellations
  for select using (auth.uid() = by_user);

grant select, insert, delete on public.cancellations to authenticated;

-- Who voted is nobody's business; the count is.
drop view if exists public.cancelled;

create view public.cancelled as
  select on_date, period, count(*)::int as votes
  from public.cancellations
  group by on_date, period;

grant select on public.cancelled to anon, authenticated;


-- ---------- STEP 4 · what the CR can do ----------
-- Two functions, both refusing anyone who is not the CR.

create or replace function public.is_cr() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students
    where claimed_by = auth.uid() and role = 'cr'
  );
$$;

-- Undo a wrong claim so the name goes back on the list.
create or replace function public.cr_release(p_sno int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_cr() then
    raise exception 'only the CR can do that' using errcode = '42501';
  end if;
  update public.students
     set claimed_by = null, claimed_at = null, username = null,
         github = null, linkedin = null, instagram = null, mobile = null, email = null
   where sno = p_sno;
end;
$$;

-- Add someone the printed list missed.
create or replace function public.cr_add_student(p_name text, p_batch text)
returns int language plpgsql security definer set search_path = public as $$
declare v_sno int;
begin
  if not public.is_cr() then
    raise exception 'only the CR can do that' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' or p_batch not in ('F1','F2') then
    raise exception 'need a name and batch F1 or F2' using errcode = '22023';
  end if;
  select coalesce(max(sno), 0) + 1 into v_sno from public.students;
  insert into public.students (sno, name, batch) values (v_sno, trim(p_name), p_batch);
  return v_sno;
end;
$$;

revoke all on function public.is_cr()                       from public, anon;
revoke all on function public.cr_release(int)               from public, anon;
revoke all on function public.cr_add_student(text, text)    from public, anon;
grant execute on function public.is_cr()                    to authenticated;
grant execute on function public.cr_release(int)            to authenticated;
grant execute on function public.cr_add_student(text, text) to authenticated;


-- ---------- STEP 5 · make Daksh the CR ----------

update public.students set role = 'cr' where sno = 48;


-- ---------- STEP 6 · check ----------

select
  (select count(*) from public.students)                    as students,
  (select count(*) from public.students where role = 'cr')  as crs,
  (select count(*) from public.cancellations)               as cancellations;
