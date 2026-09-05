# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing: a single self-contained `timetable.html` — no build step, no framework, no bundler, no network dependency beyond a Google Fonts stylesheet. The whole app (markup, styles, logic, dataset) lives in one file that can be opened from disk, mailed, or dropped on any static host. This is a hard constraint, not an accident: it is how the file gets shared with classmates.

## Users

Primary: **B.Tech first-year students of Sec F, IT-I at Dr. Akhilesh Das Gupta Institute of Professional Studies (ADGIPS)**, New Delhi. First-year engineering students, 17–19, phone-native.

Situation of use — two distinct scenes, confirmed as equally important:

1. **Between classes, standing in a corridor, one hand on the phone.** Ten seconds of attention. "What do I have now, where, and when does it end."
2. **Sitting down, deciding whether to skip.** Marking a class present/absent and reading the 75% math: am I safe, how many can I still miss.

Secondary: classmates the link is forwarded to. The owner shares this with the section, so the app must make sense **cold**, with no verbal explanation and no setup, on first open.

## Product Purpose

One link that answers a first-year student's two recurring questions — *what's next* and *am I safe on 75%* — without logins, accounts, or a server. Success is a student opening it in a corridor, getting the answer in one glance, and never needing to ask a classmate what the next class is.

## Positioning

A section-specific timetable, not a generic scheduler. The actual Sec F IT-I dataset is baked in — real subject codes, real faculty names, real room, the real F1/F2 practical batch split, and the real GGSIPU 2026 holiday order. A general calendar app cannot answer "which lab does batch F1 have on Thursday" or "does this holiday cancel my class"; this does, with zero data entry. Attendance is layered onto that same known schedule, so marking a day is tapping the classes that were actually scheduled rather than typing subjects in.

## Operating Context

- Institute: ADGIPS, FC-26 Shastri Park, New Delhi–110056. Room 2311. Session 2026–2027.
- Class day runs Mon–Fri, 08:15–15:10, with a fixed lunch break 11:00–11:30 that sits between period 3 and period 4.
- Seven teachable periods per day; labs occupy two consecutive periods.
- Students belong to practical batch **F1** or **F2**. On Tue/Thu/Fri the two batches run different labs in the same slot; a student's own batch determines which one is theirs.
- Attendance rule that governs student behavior: **75% minimum**. Below it, a student is at risk of being barred. All attendance math exists to serve this single threshold.
- Holidays follow the GGSIPU office order F.1(6)(21)/2010/Estt.-NT/10463 dated 18 Dec 2025, which distinguishes **gazetted** holidays (institute closed) from **restricted** holidays (optional, institute decides).
- Coordinators of record: Dr. Shalini Malik (time table coordinator, B.Tech First Year), Dr. Daisy Bhat (Incharge, B.Tech First Year).

## Capabilities and Constraints

Confirmed functionality that must survive any redesign:

- **Week timetable** for Mon–Sat with per-slot subject, faculty, lab flag, and the F1/F2 split; Saturday has no classes.
- **Batch selector** (F1 / F2 / Both), persisted to `localStorage` under `adgips-batch`.
- **Live status**: which class is in session right now, when it ends, what is next (rolling into following days), lunch break, and gazetted-holiday override.
- **Attendance marking** per date, per scheduled class, with three states: Present / Absent / Cancelled. A student who joins mid-term is offered a **catch-up** pass over every untouched class day since the session opened, markable a whole day at a time. Cancelled classes are excluded from the percentage entirely. Records persist to `localStorage` under `adgips-att`, keyed `<iso-date>|<item-index>`.
- **75% math read against the whole term**, per subject and overall. The term runs from the session opening (17 Aug 2026) to an editable last teaching day; class days exclude Sundays, Saturdays and gazetted holidays, so the app knows how many classes are still to come. From that it reports: percentage held, the **bunk budget** (how many of the remaining classes can still be missed and finish on 75%), how many of them are mandatory, the ceiling if every remaining class is attended, the last date a student could stay away, and what a chosen stretch of leave costs. This math has a self-check (`demo()`) that must keep passing.
- **Holiday calendar** for all of 2026 in three tiers: **gazetted** (institute closed — never counted as class days), **usually closed** (restricted on paper but taken in practice here — Raksha Bandhan, Smarta Janmashtami, Mahashtami, Govardhan Puja, Bhai Duj, Holika Dahan, Ambedkar Jayanti, Christmas Eve — always shown, flagged everywhere, but still counted until the student marks them Off), and the rest of the **restricted** list behind a toggle. A guess never silently removes a class from the denominator.
- **.ics export** of the weekly schedule as repeating events until 31 Dec 2026, with gazetted holidays pre-excluded. Delivered as copyable text because a file download cannot be relied on from a local or sandboxed page.
- **Detail view** on any class and any holiday.

Technical constraints:

- Single file, no build, no framework, no bundler. `localStorage` is the source of truth for every screen — existing keys must be honored so nobody loses records they already marked, and the app must draw every page with no signal. Supabase backs the account-only features (roster claim, leaderboard totals, section directory, cancelled-class reports) and now keeps a **copy** of the attendance marks so a lost phone does not lose the term. The cloud is never read to render: it syncs into `localStorage` and the page draws from there. Merge rule on collision is newest-write-wins, with an unseen local record always pushed rather than dropped (`mergeMark`, checked by `demo()`).
- Must work opened directly from disk (`file://`) and from a data: URL, where `location.hash` and history are unreliable — navigation cannot depend on them.
- **A native Android app is planned as a later, separate build.** This web version is the current product and stays web; its structure and interaction model should be phone-shaped enough that the eventual Android app is a translation rather than a rethink. It is not an Android app now and must not adopt Android's native design language.

Undecided: whether the Android app reuses this data model, and whether attendance ever syncs across devices. Neither is designed for now.

## Evidence on Hand

- The real Sec F IT-I timetable: 14 subjects with actual codes (ICT 101 T, ICT 103 T, ICT 107, ICT 111 T/P, ICT 113, ICT 117 P, ICT 119, ICT 123, ICT 151, EM 117 T, PD) and the named faculty for each.
- The real GGSIPU 2026 holiday list: 18 gazetted and 33 restricted entries with dates and names.
- No usage data, no testimonials, no analytics, no user research beyond the owner. Future work must not invent adoption numbers, ratings, or classmate quotes.

## Product Principles

1. **Answer in one glance.** The corridor scene sets the bar: the current and next class must be legible without scrolling, reading, or tapping.
2. **The 75% line is the emotional center.** Attendance is not a log, it is a risk gauge. Always show the consequence ("can miss 3 more"), never just the number.
3. **Cold-open legible.** A classmate opening the forwarded link with no explanation must understand what they are looking at and pick their batch without instruction.
4. **Never lose a record.** Attendance data is hand-entered over months and irreplaceable; storage keys, clearing, and destructive actions are handled conservatively.
5. **Stay one file.** Every feature must survive the constraint that this is a single portable HTML document with no build step.

## Accessibility & Inclusion

- Keyboard-operable and focus-visible throughout; the incumbent uses real `<button>` elements with `aria-pressed` for every toggle, which must be preserved.
- Honors `prefers-reduced-motion` and `prefers-color-scheme`, with an explicit theme override.
- Used one-handed on a phone in a corridor: touch targets must be comfortably tappable, and primary actions reachable in the lower half of the screen.
