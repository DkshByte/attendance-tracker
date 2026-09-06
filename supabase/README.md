# Supabase Database Schemas & Migrations

This directory contains the SQL setup scripts for **Bunkr** (Universal College Attendance Tracker & Smart Timetable).

---

## 📋 Execution Sequence

When setting up a new Supabase project, execute these scripts in **Supabase SQL Editor** in numerical order:

| Step | File | Purpose | Key Objects Created |
|---|---|---|---|
| **01** | [`01-students-setup.sql`](./01-students-setup.sql) | Roster table & 60 student accounts | `public.students`, RLS policies for claiming accounts |
| **02** | [`02-attendance-setup.sql`](./02-attendance-setup.sql) | Cloud attendance sync storage | `public.attendance`, RLS policies, indexes |
| **03** | [`03-devices-setup.sql`](./03-devices-setup.sql) | Single-device session & eviction | `claim_device()` function, device columns |
| **04** | [`04-leaderboard-setup.sql`](./04-leaderboard-setup.sql) | Section attendance leaderboard | `public.leaderboard`, aggregated stats |
| **05** | [`05-features-setup.sql`](./05-features-setup.sql) | CR role, contacts & cancelled classes | CR authorization, class cancellations |
| **Reset** | [`production-reset.sql`](./production-reset.sql) | Clean production launch reset | Truncates marks and resets roster claims |

---

## 🔐 Architecture Notes

- **Offline-First / LocalStorage Sync**:
  The client app stores records locally in browser `localStorage`. Supabase acts as the persistent cloud mirror so a student never loses data if they switch phones or clear cache.
- **Row-Level Security (RLS)**:
  All tables enforce strict PostgreSQL RLS policies. Students can only insert, update, or clear attendance records that belong to their own authenticated `auth.uid()`.
- **Single-Device Session Tracking**:
  Each student account only permits one active device at a time. Signing in on a new device prompts an eviction of previous sessions via `claim_device()`.
