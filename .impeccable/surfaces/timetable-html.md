---
version: 1
slug: "timetable-html"
primary_target: "timetable.html"
related_targets: []
---

# Surface brief — timetable.html

Scope: the whole single-file app (Today, Week, Attendance, Holidays). Visitor mode: **Operate**.

Audience: Sec F IT-I first-years, phone in a corridor between classes, and again at 1am deciding whether to skip the 8:15. Two co-equal tasks: *what's next* and *am I safe on 75%*. Link gets forwarded to classmates, so it must read cold. Constraints: one file, no build, no backend, `localStorage` keys `adgips-batch` / `adgips-att` preserved, must work from `file://`.

## Direction contract

**THESIS:** A school day is a line and its periods are stations, so "what's next" is answered by the form itself. Refuses the rounded-card dashboard with a progress ring and a greeting that every student attendance app ships.

**OWN-WORLD:** Midnight enamel ground, porcelain white ink, nine Delhi Metro line colours — one per subject family, labs riding their parent line. Barlow Condensed signage caps over Barlow with tabular figures. Rails, station discs, interchange rings, 45°/90° geometry only. Line ink lives in rails, discs and edge marks; the reading field stays achromatic.

**STORY:** The student sees exactly where they stand on today's line, which station is next and when, and which subject lines are running below the 75% service level. Tapping a station marks attendance and previews the percentage it will produce.

**FIRST VIEWPORT:** (390px portrait) A status plate stamped with the live state and minutes remaining; beneath it today's rail runs down the left edge with a live position marker interpolated by real clock time — travelled rail solid, rail ahead hairline; stations carry time, subject, faculty, room; free periods are real dashed voids sized to their duration; fixed signage nav bar at thumb height.

**FORM:** Red Line — candidate 1 of my ordered grounded list, taken as IMPECCABLE'S PICK over the roll's assigned candidate 6 (Office Order); seed key c25a3d76. Code-led.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction

The live marker: a continuously moving position disc on today's rail, interpolated between period stations by clock time, painting the rail behind it solid and leaving the rail ahead hairline, so the day visibly fills in as it passes.

## Carried raises

- *Preview before commit* — an attendance mark shows the percentage it will produce before it lands.
- *Colour at the edges only* — nine line inks never flood the reading field.
- *Voids with real size* — free periods are gaps with actual duration, not equal cells.

## Unresolved

Native Android build is a later, separate project; nothing here adopts Android's design language.
