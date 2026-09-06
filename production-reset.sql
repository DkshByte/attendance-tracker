-- ============================================================
-- Sec F IT-I — Production Database Reset
-- Run this in Supabase → SQL Editor to get a clean launch state.
-- ============================================================

-- ---------- 1. Clear test attendance marks & cancellations ----------
truncate table public.attendance;
truncate table public.cancellations;
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leaderboard') then
    execute 'truncate table public.leaderboard';
  end if;
end $$;

-- ---------- 2. (OPTIONAL) Delete test auth users ----------
-- If you want test students to register with their emails again fresh,
-- uncomment the line below:
-- delete from auth.users;

-- ---------- 3. Reset students to pristine state ----------
update public.students
   set claimed_by            = null,
       claimed_at            = null,
       username              = null,
       present               = 0,
       held                  = 0,
       github                = null,
       linkedin              = null,
       instagram             = null,
       mobile                = null,
       email                 = null,
       active_device_id      = null,
       active_device_name    = null,
       active_device_at      = null,
       attendance_cleared_at = null,
       updated_at            = now();

-- ---------- 4. Ensure all 60 official student names & batches ----------
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
on conflict (sno) do update
  set name = excluded.name,
      batch = excluded.batch;

-- ---------- 5. Set Daksh as CR ----------
update public.students set role = 'student';
update public.students set role = 'cr' where sno = 48;

-- ---------- 6. Verification query ----------
select
  count(*) as total_students,
  count(*) filter (where claimed_by is not null) as claimed_count,
  count(*) filter (where role = 'cr') as cr_count,
  (select count(*) from public.attendance) as attendance_records,
  (select count(*) from public.cancellations) as cancellations_count
from public.students;
