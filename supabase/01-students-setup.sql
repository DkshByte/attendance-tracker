-- ============================================================
-- Sec F IT-I — roster + accounts
-- Run these ONE STEP AT A TIME in the SQL Editor.
-- Each step is short on purpose; the editor has been flaky.
--
-- Model: the roster is the source of truth. A student claims
-- their own row once, and from then on that row is theirs.
-- Names come from the official IT (F) list; 1–30 are batch F1,
-- 31–60 are batch F2.
-- ============================================================


-- ---------- STEP 1 · the roster table ----------

create table if not exists public.students (
  sno        int primary key,
  name       text not null,
  batch      text not null check (batch in ('F1','F2')),
  username   text unique,
  claimed_by uuid unique,
  claimed_at timestamptz,
  present    int not null default 0,
  held       int not null default 0,
  updated_at timestamptz not null default now()
);


-- ---------- STEP 2 · the 60 students ----------
-- Safe to re-run: names update, claims are left alone.

insert into public.students (sno, name, batch) values
  (1,'Aditya Dixit','F1'),          (2,'Anjali Yadav','F1'),
  (3,'Jiya Joarder','F1'),          (4,'Kartik Shukla','F1'),
  (5,'Md. Jaid','F1'),              (6,'Sumeet Kumar Singh','F1'),
  (7,'Jatin Kumar','F1'),           (8,'Dilshan Ahmad','F1'),
  (9,'Nishant Srivastava','F1'),    (10,'Keshav Choudhary','F1'),
  (11,'Sonu Kumar Mandal','F1'),    (12,'Ankit Kumar Prajapati','F1'),
  (13,'Arnav Rohilla','F1'),        (14,'Nikhil Tyagi','F1'),
  (15,'Bhavya Prakash','F1'),       (16,'Karan Saini','F1'),
  (17,'Ahana Gupta','F1'),          (18,'Ravi Joshi','F1'),
  (19,'Anshu Khatri','F1'),         (20,'Kartik Dhawan','F1'),
  (21,'Kunal Dogra','F1'),          (22,'Meenakshi Saun','F1'),
  (23,'Nikhil Singh','F1'),         (24,'Daksh Narain','F1'),
  (25,'Madhur Jain','F1'),          (26,'Md Mehran','F1'),
  (27,'Gaurav Chauhan','F1'),       (28,'Aditya','F1'),
  (29,'Shabaz Ali','F1'),           (30,'Palak Sharma','F1'),
  (31,'Krish','F2'),                (32,'Divyam Sharma','F2'),
  (33,'Tanupriya Purohit','F2'),    (34,'Drashey Mittal','F2'),
  (35,'Nitin Kumar','F2'),          (36,'Khushi Gupta','F2'),
  (37,'Abhinav Kumar','F2'),        (38,'Shree Yukta Tyagi','F2'),
  (39,'Shravan Chauhan','F2'),      (40,'Veer Jha','F2'),
  (41,'Pranjal Saxena','F2'),       (42,'Aryan Anand','F2'),
  (43,'Prashant Kumar','F2'),       (44,'Lakshay Yadav','F2'),
  (45,'Shrey Sharma','F2'),         (46,'Shivam Singh Rawat','F2'),
  (47,'Kirti Dixit','F2'),          (48,'Daksh Sharma','F2'),
  (49,'Nikhil Kant','F2'),          (50,'Aastha Pandey','F2'),
  (51,'Aditya Shekhar','F2'),       (52,'Chaitanya Jindal','F2'),
  (53,'Prateek Rawat','F2'),        (54,'Divyanka','F2'),
  (55,'Shaurya Rana','F2'),         (56,'Samarth Ahuja','F2'),
  (57,'Isha Chhikara','F2'),        (58,'Shaurya Shandilya','F2'),
  (59,'Sanchit Thakur','F2'),       (60,'Divyanshi Malik','F2')
on conflict (sno) do update set name = excluded.name, batch = excluded.batch;


-- ---------- STEP 3 · lock the table down ----------
-- A student may read and write only the row they have claimed.
-- Nobody reads anyone else's numbers, ever.

alter table public.students enable row level security;

drop policy if exists "read own row"   on public.students;
drop policy if exists "update own row" on public.students;

create policy "read own row" on public.students
  for select using (auth.uid() = claimed_by);

create policy "update own row" on public.students
  for update using (auth.uid() = claimed_by) with check (auth.uid() = claimed_by);

-- No insert or delete policy: the roster is fixed. Students only
-- ever claim an existing row, and only through the function below.

grant select, update on public.students to authenticated;


-- ---------- STEP 4 · the pick-your-name list ----------
-- Names and whether each is taken. No emails, no percentages.

drop view if exists public.roster;

create view public.roster as
  select sno, name, batch, username, (claimed_by is not null) as claimed
  from public.students
  order by sno;

grant select on public.roster to anon, authenticated;


-- ---------- STEP 5 · the ranks board ----------

drop view if exists public.leaderboard_ranks;

create view public.leaderboard_ranks as
  select
    name, username, batch,
    rank() over (
      order by (present::numeric / nullif(held,0)) desc nulls last, held desc
    ) as rank
  from public.students
  where held > 0 and claimed_by is not null;

grant select on public.leaderboard_ranks to anon, authenticated;


-- ---------- STEP 6 · claiming a name, atomically ----------
-- Runs as the table owner so it can see unclaimed rows, but it
-- can only ever assign the CALLER's own id. The where-clause is
-- what makes two students racing for one name safe: whoever
-- commits first wins and the other gets "already claimed".

create or replace function public.claim_student(p_sno int, p_username text)
returns public.roster
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.roster;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if p_username is null or p_username !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'bad username' using errcode = '22023';
  end if;

  if exists (select 1 from public.students where claimed_by = auth.uid()) then
    raise exception 'this account already claimed a name' using errcode = '23505';
  end if;

  update public.students
     set claimed_by = auth.uid(),
         claimed_at = now(),
         username   = lower(p_username)
   where sno = p_sno
     and claimed_by is null;

  if not found then
    raise exception 'that name is already claimed' using errcode = '23505';
  end if;

  select sno, name, batch, username, true
    into v_row
    from public.students where sno = p_sno;

  return v_row;
end;
$$;

revoke all on function public.claim_student(int, text) from public, anon;
grant execute on function public.claim_student(int, text) to authenticated;


-- ---------- STEP 7 · prove it worked ----------
-- Expect: 60 students, 30 in each batch.

select batch, count(*) from public.roster group by batch order by batch;
