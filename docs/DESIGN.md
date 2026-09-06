---
name: Sec F IT-I — Red Line
description: A school day drawn as a metro line; periods are stations on it.
colors:
  ground: "#070C1C"
  plate: "#0F1830"
  plate-2: "#17223F"
  plate-3: "#1D2A4C"
  rule: "#26314F"
  rule-soft: "#1A2340"
  rail: "#2C3859"
  ink: "#F3F6FC"
  ink-2: "#A6B3CE"
  ink-3: "#6E7C99"
  badge-ink: "#08101F"
  line-pps: "#FF4D40"
  line-bee: "#FFB92E"
  line-phy: "#4E96FF"
  line-smt: "#35D07F"
  line-em: "#B18CFF"
  line-csl: "#FF6BB0"
  line-evs: "#29D6CD"
  line-eg: "#FF9147"
  line-pd: "#93A3C0"
  ok: "#35D07F"
  warn: "#FFB92E"
  bad: "#FF4D40"
  focus: "#4E96FF"
  ground-light: "#EEF1F7"
  plate-light: "#FFFFFF"
  ink-light: "#0A1024"
  rail-light: "#C3CCDE"
  line-pps-light: "#D62B1F"
typography:
  display:
    fontFamily: "Blinker, sans-serif"
    fontSize: "clamp(30px, 8.4vw, 44px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Blinker, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  figure:
    fontFamily: "Blinker, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Blinker, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.004em"
  body:
    fontFamily: "Blinker, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tabular-nums"
  meta:
    fontFamily: "Blinker, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.25
  label:
    fontFamily: "Blinker, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.16em"
  signage:
    fontFamily: "Blinker, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.1em"
  nav:
    fontFamily: "Blinker, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  hairline: "3px"
  control: "9px"
  field: "10px"
  surface: "12px"
  plate: "14px"
  dialog: "16px"
  sheet: "24px 24px 0 0"
  pill: "999px"
  disc: "50%"
spacing:
  hairline: "1px"
  xs: "7px"
  sm: "10px"
  md: "13px"
  lg: "18px"
  xl: "22px"
  section: "38px"
  gutter: "18px"
components:
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "18px 18px 16px"
  station-card:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "13px 15px"
  badge:
    backgroundColor: "{colors.line-pps}"
    textColor: "{colors.badge-ink}"
    typography: "{typography.signage}"
    rounded: "{rounded.hairline}"
    padding: "3px 9px"
  badge-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.line-pps}"
    typography: "{typography.signage}"
    rounded: "{rounded.hairline}"
    padding: "3px 9px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.control}"
    padding: "11px"
  button-secondary:
    backgroundColor: "{colors.plate-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px"
  button-go:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.signage}"
    rounded: "{rounded.field}"
    padding: "13px"
    width: "100%"
  segment:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "2px"
  segment-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
  mark-present:
    backgroundColor: "{colors.ok}"
    textColor: "{colors.badge-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  mark-absent:
    backgroundColor: "{colors.bad}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  mark-cancelled:
    backgroundColor: "{colors.ink-3}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  field:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  contact-field:
    backgroundColor: "{colors.plate-2}"
    textColor: "{colors.ink}"
    rounded: "13px"
    padding: "10px 13px"
  dialog:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "20px 22px"
    width: "calc(100% - 28px)"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.nav}"
    padding: "10px 1px 9px"
    height: "58px"
  nav-item-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
    padding: "10px 1px 9px"
    height: "58px"
  travelcard:
    backgroundColor: "{colors.plate-2}"
    textColor: "{colors.ink}"
    rounded: "15px"
    padding: "17px 18px 20px"
---

# Design System: Sec F IT-I — Red Line

## Overview

**Creative North Star: "The Metro Network Map"**

A school day is a line and its periods are stations, so the form itself answers *what's next*. The whole product is drawn with the vocabulary of a transit network: a vertical rail down the left edge, station discs where classes sit, hairline dashed voids where free periods sit, a live position marker that moves down the rail by real clock time, interchange-style colour coding by subject family, and signage-grade condensed capitals for anything that behaves like a sign. Nothing here is a dashboard: no progress rings, no rounded hero cards, no illustration.

The world is midnight enamel and porcelain ink. The reading field — every card body, every faculty name, every number you actually read — is achromatic: ground, plate, three inks. Colour is structural, not decorative; it appears as *line ink* in rails, station discs, subject titles, and edge marks, and it always means "this belongs to that subject's line". Nine line colours cover fourteen subjects, labs riding their parent line. The palette re-tints wholesale for light theme (a hand-picked second set at higher contrast) rather than being algorithmically lightened.

Density is phone-first and one-handed: a 390px portrait viewport carries a status plate, today's rail, and a fixed six-slot signage nav at thumb height. Surfaces are close-toned rather than shadowed; three plate steps and two rule weights do most of the depth work, and shadows are reserved for things that genuinely float. The app ships both as a web page opened from a link and as a Capacitor Android build (`in.adgips.secf`), and the native layer is tuned to make the second one stop reading as a wrapped web page.

**Key Characteristics:**
- Rails, station discs, and 45°/90° geometry as the primary structural device
- Achromatic reading field; nine metro line inks only at rails, discs, titles, and edges
- Blinker geometric typography matching the Bunkr brand and logo, tabular figures everywhere
- Close-toned plate stack (three steps) with shadows only under true floaters
- Live, time-driven state: the marker and travelled rail move as the day passes
- Full dark/light parity through re-tinted tokens, not opacity tricks

## Colors

A midnight enamel ground carrying porcelain ink, with a nine-colour transit palette that lives strictly at the edges of the reading field.

### Primary
- **Red Line** (`--l-pps`, #FF4D40 dark / #D62B1F light): The system's identity colour. The section mark bullet, the nav's active tab underline, the today-row wash on the week diagram, gazetted holiday cells, the "me" rank disc, the user avatar, text selection, and the caret. Also the launch-screen station disc in the Android build.
- **Blue Line** (`--l-phy`, #4E96FF dark / #1560D8 light): Doubles as `--focus`. Every focus ring is the Blue Line, deliberately not a browser blue; also the ink for links inside dialogs and for the email/mobile contact fields when filled.

### Secondary — the remaining line inks
Seven further subject-family colours, each used identically to the two above: **Amber** (`--l-bee`, #FFB92E / #9C6500), **Green** (`--l-smt`, #35D07F / #0E8C4E), **Violet** (`--l-em`, #B18CFF / #6B3FD4), **Magenta** (`--l-csl`, #FF6BB0 / #C42B77), **Teal** (`--l-evs`, #29D6CD / #0A857E), **Orange** (`--l-eg`, #FF9147 / #BF5210), **Grey Line** (`--l-pd`, #93A3C0 / #5A6883). A `data-line` attribute on any container binds one of them to the local `--line` variable, which every rail, disc, bar, badge, and subject title reads. `data-line=""` falls back to `--ink-2` — an uncoloured line is grey, never a default accent.

### Tertiary — service state
- **Service OK** (`--ok`, #35D07F / #0E8C4E): at or above 75%; the Present mark; a live sync dot.
- **Service warning** (`--warn`, #FFB92E / #9C6500): approaching the line; the catch-up banner's border.
- **Service failure** (`--bad`, #FF4D40 / #D62B1F): below 75%; the Absent mark; error hints; destructive menu items.
These are the same hues as three line inks by design — the service tier reuses the network's own palette rather than introducing a semantic set.

### Neutral
- **Enamel ground** (`--bg`): the page behind everything, and the fill inside every station disc so the disc reads as a hole punched in the rail.
- **Plate / Plate-2 / Plate-3** (`--plate`, `--plate-2`, `--plate-3`): the three-step surface stack. Plate is the default card; Plate-2 is a recessed field or inset row (up-next, contact fields, marks strip, secondary buttons); Plate-3 is the hover/active state of those recessed surfaces.
- **Rule / Rule-soft** (`--rule`, `--rule-soft`): the two border weights. Rule is a visible card edge; Rule-soft is the hairline used both for section-heading leaders and as the 1px grid gap colour behind hairline-separated lists.
- **Rail** (`--rail`): the unlit track — the untravelled rail, dashed voids, empty gauge tracks, and the hover border of any interactive card.
- **Ink / Ink-2 / Ink-3** (`--ink`, `--ink-2`, `--ink-3`): porcelain primary, secondary metadata, and tertiary label ink. `--ink` doubles as the fill of primary buttons and selected segments, inverting to `--bg` text.
- **Badge ink** (`--badge-ink`, #08101F dark / #FFFFFF light): the text colour on any surface filled with a line ink, flipped per theme so a filled badge is legible in both.

### Named Rules
**The Edge Ink Rule.** Line colour appears only in rails, station discs, bars, badges, gauge fills, and subject titles. It never fills a reading surface and never tints body copy. If a block of text you actually read is coloured, it is wrong.

**The Grey Fallback Rule.** An element with no line assigned renders in `--ink-2`, never in the Red Line. The identity colour is not the default.

**The Two Palettes Rule.** Light theme is a second hand-picked set of the same nine hues at print contrast, not the dark set lightened. Any new colour must be authored twice, in `:root` and in both light overrides (`prefers-color-scheme` and `[data-theme="light"]`).

## Typography

**Primary Font:** Blinker (300/400/600/700/800/900), matching the Bunkr logo wordmark, with ui-sans-serif and system-ui fallbacks
**Mono:** ui-monospace / SFMono-Regular / Menlo, used only in the .ics export textarea and inline setup code

**Character:** Condensed grotesque signage over a plain grotesque body — the exact pairing a transit system uses for station names against timetable print. Everything numeric is tabular by default (`font-variant-numeric: tabular-nums` on `body`), so percentages, clocks, and counts never shift width as they tick.

### Hierarchy
- **Display** (Blinker 700, clamp 30–44px, line-height 1.02, tracking -0.012em, balanced wrap): the status plate's single live statement. One per screen.
- **Headline** (Blinker 700, 29px, tracking -0.005em): the dialog subject name; 23px in the identity-row variant.
- **Figure** (Blinker 700, 25–40px, tracking -0.01em): the big numbers — summary stats (30px, 40px for the lead stat), subject percentages (27px), profile stats (25px), the plan-bar total (30px). Always paired with a small uppercase caption beneath or beside it.
- **Title** (Blinker 700, 17–22px): subject names on cards and rows — 22px on the today rail, 19px in attendance rows and the up-next block, 18px on the service board, 17px on the week diagram.
- **Body** (Blinker 400/500, 15px, line-height 1.45): default reading size; 14.5px for dialog subtitles.
- **Meta** (Blinker 500/600, 12–13.5px): faculty, room, times, hints. `--ink-2` for content, `--ink-3` for structure.
- **Label** (Blinker 700, 13px, tracking 0.16em, uppercase): section headings, which run as a caps line followed by a hairline leader that fills the remaining width.
- **Micro-label** (Blinker 700, 9.5–11.5px, tracking 0.09–0.12em, uppercase, `--ink-3`): field labels, stat captions, and data captions above a value.
- **Signage** (Blinker 700, 11–19px, tracking 0.055–0.13em, uppercase): the section mark, badges, the primary CTA, sheet headings, group headers — anything that behaves like a sign rather than a sentence.

### Named Rules
**The Signage Rule.** Blinker is for signs and numbers: station names, badges, big figures, primary actions. Prose is never condensed. If it is a sentence, it is Blinker.

**The Tabular Rule.** Every figure in the app is tabular-lined. Nothing that updates on a clock tick may reflow.

**The Caps Tracking Rule.** Uppercase is always tracked out — 0.16em at heading size, 0.09–0.13em at micro size, never uppercase at default tracking.

## Layout

A single centred column: `.page` at max-width 960px (1000px on desktop) with an 18px gutter and 136px of bottom padding to clear the fixed nav. The outer `.shell` caps at 1320px. Vertical rhythm is set by section headings at 38px above / 13px below; surfaces sit 14–22px apart within a section.

The spine of the Today and mobile-week views is `.railwrap`: 44px of left padding with a 2px rail drawn at x=20px from 8px top to 8px bottom, and stations hanging off it via negative offsets (nodes at -31px, duration spans at -25px, dashed voids at -24px). Station vertical position is driven by a per-stop `--nodetop` custom property so a station disc aligns with its card regardless of card height. Free periods are laid out with real proportional height, not equal cells.

Hairline-separated lists are built with `display:grid; gap:1px` over a `--rule-soft` background, so the 1px gaps read as rules and the container clips them with `overflow:hidden` and a 12px radius. This is the standard pattern for the service board, line key, directory, holiday list, catch-up list, and leaderboard.

Breakpoints: **400px** (nav labels drop to 9px and icons to 24px), **560px** (top bar tightens, sheet dialogs become bottom sheets, gate form drops to the thumb, summary becomes a flex row), **700px** (line key goes two-column), **900px** (the wide week network diagram replaces the mobile day view), **980px** (the bottom nav becomes a 212px left rail and the page shifts right). Auto-fill grids handle the month calendar (min 152px), holiday list (min 272px), and directory.

Native and safe areas: `viewport-fit=cover`, with `env(safe-area-inset-top)` added to the top bar's padding and `env(safe-area-inset-bottom)` to the nav, the gate, and the bottom sheet. The top bar's measured height is published at runtime as `--top-h` (fallback 57px) and consumed by `scroll-margin-top` and sticky group headers.

### Named Rules
**The Thumb Rule.** Primary actions live in the lower half on a phone: the nav is fixed at the bottom, the sign-in form is pushed down with `margin-top:auto`, and sheets rise from the bottom edge.

**The Hairline Grid Rule.** Lists are separated by 1px grid gaps over `--rule-soft`, never by per-row borders.

## Elevation & Depth

Depth is tonal first, shadowed last. Three plate steps and two rule weights carry almost all layering; a surface that sits *inside* another goes down a plate step rather than gaining a shadow. Shadows appear only where something genuinely floats above the page — the status plate, a hovered card, the dropdown, the dialog — and they are dark, tight, and low-opacity rather than diffuse glows. Light theme swaps the shadow colour from pure black to a navy-tinted ink so the shadows do not go grey.

Focus and live states are drawn as rings, not shadows: a live station gets `box-shadow: 0 0 0 1px var(--line)` stacked with `--lift`, and station discs are drawn entirely with `inset` box-shadows over the ground colour so the disc reads as a punched hole.

### Shadow Vocabulary
- **Lift** (`--lift`: `0 1px 1px rgba(0,0,0,.5), 0 10px 28px -18px rgba(0,0,0,.9)`): the resting elevation of the status plate and the hover elevation of any card.
- **Lift Large** (`--lift-lg`: `0 2px 4px rgba(0,0,0,.4), 0 20px 44px -22px rgba(0,0,0,1)`): dialogs and sheets only.
- **Lift Edge** (`--lift-edge`: `0 4px 10px -6px rgba(0,0,0,.85)`): for surfaces that already have a visible border — currently the user dropdown.
- **Backdrops**: the top bar and nav are `color-mix` of the ground at 86%/92% with `backdrop-filter: blur(14–18px) saturate(1.4)`; the dialog backdrop is the ground at 72% with a 4px blur.

### Named Rules
**The Tonal-First Rule.** Nesting is expressed by stepping down the plate stack (plate → plate-2 → plate-3), not by adding a shadow. Only floating layers get a shadow.

**The Punched Disc Rule.** Station discs, ticks, and rank badges are `--bg` filled with an inset ring in the line ink. The ring is the disc; there is no border property involved.

## Shapes

Corners are gently squared, not pill-soft, and the scale is deliberate: 3px on badges (the smallest, so a badge reads as a stamped sign), 9–10px on controls (buttons, inputs, the .ics textarea, desktop nav items), 12px on surfaces (cards, rows, boards, calendar months, empty states), 14px on the status plate, 15px on the travelcard, 16px on dialogs, 24px on the top two corners of a bottom sheet, 999px for segmented controls, chips, mark strips, and the user pill, and 50% for every station disc, tick, avatar, and rank badge.

The form language is transit-diagram geometry: strictly horizontal and vertical strokes (2px rails, 4–6px duration bars, 5px key bars), rounded stroke caps at half the stroke width (1–3px radii on bars), circular stations, and dashed strokes for absence — a 2px dashed border marks a free period or an empty slot, and a dashed 1px `--rule` border marks an empty state. Interactive rows and lists have no visible scrollbar anywhere; scrollbar rendering is disabled globally so nothing gives away that this is a page in a browser.

Iconography is inline SVG only, 15–26px, `stroke-width` 1.6 at rest and 2 on the active nav item.

### Named Rules
**The Dashed Absence Rule.** A dashed stroke means nothing is scheduled there. Solid means a class; dashed means a void; there is no third state.

**The Right-Angle Rule.** Rails and bars run vertical or horizontal only. No diagonals, no curves in the diagram layer.

## Components

### Status Plate (`.plate`)
The signature surface: a stamped board carrying the live state. Plate background, `--rule` border, 14px radius, `--lift`, 18px padding, `overflow:hidden`. Inside: a badge row, a display-size live statement, a supporting who/where line, and a gauge — a 4px `--rule` track with a line-ink fill that transitions its width over 1s linear (a real clock, so no easing), captioned by a tracked uppercase row with a `--ink` bold figure.

### Station Rail (`.railwrap` / `.stop` / `.card`)
The core pattern. A 2px `--rail` track with `.stop` entries hanging off it: a 16px punched disc (`.node`) at `--nodetop`, a 4px duration bar (`.span`) sized to the class's real length, and a card. Cards are plate/`--rule`/12px with 13×15px padding; hover lifts them 2px and swaps the border to `--rail`; the live stop gains a 1px line-ink ring; past stops drop to 0.78 opacity with their disc and bar at 0.3; suspended stops drop to 0.55 with the subject name struck through and the disc forced to a grey ring. Free periods (`.gap`) are dashed voids sized to their duration; lunch gets an oversized 20px grey-ringed disc. The batch split renders as a `.branch` — two arms, each a 4px line-ink bar with its own subject and faculty.

### Live Marker (`.marker` / `.travelled`)
The signature interaction. The travelled portion of the rail is redrawn in `--ink-2` at a height computed from the current time, and a 14px marker disc sits at that height: an `--ink` core with a 3px ground ring and a 5px line-ink ring, plus a pulsing halo at 0.28 opacity (`ping`, 2.6s, infinite). Both the marker's `top` and the travelled rail's `height` transition over 1.2s on `--ease`, so the day visibly fills in. The marker takes the current class's line ink, falling back to the Red Line.

### Buttons
- **Shape:** squared-soft (9px), full-width CTA at 10px, pills (999px) for anything segmented.
- **Primary** (`.btn.pri`): inverted — `--ink` fill, `--bg` text, matching border; hover dims with `filter: brightness(.92)`.
- **CTA** (`.go`): full width, 13px padding, Blinker 700 uppercase at 16px / 0.07em; disabled drops to 0.35 opacity.
- **Secondary** (`.btn`): plate-2 fill, `--rule` border; hover moves to plate-3 with a `--rail` border.
- **Text** (`.link`): no chrome, `--ink-2`, underlined in `--rail` with a 4px offset; hover brings the underline to currentColor.
- **Icon** (`.iconbtn`): 34px circle (38px under 560px), plate fill, `--rule` border, `--ink-2` glyph.

### Segmented Controls and Chips
- **Segment** (`.seg`): a 999px plate track with 1px gaps and 2px padding; the pressed button inverts to `--ink` on `--bg`. Used for batch selection in the top bar.
- **Chips** (`.chips button`): 999px, plate fill, `--rule` border, horizontally scrolling with the gutter bled to the page edges; pressed inverts to `--ink`.
- All of these are real `<button>` elements carrying `aria-pressed`.

### Mark Strip (`.marks`)
The attendance primitive: a 999px plate-2 track holding three buttons — Present, Absent, Cancelled — each with a 15px inline SVG glyph. Pressed states are the only place a solid semantic fill appears: `--ok` for P, `--bad` for A, `--ink-3` for C. On pressing, the glyph plays a 0.42s `stamp` overshoot. Beneath the strip, `.preview` fades in the percentage the mark will produce before it lands, with the delta coloured `--ok` up / `--bad` down.

### Service Board (`.summary`, `.board`, `.srow`)
The 75% report. `.summary` is a two-up (flex row above 560px) figure block on a plate card: condensed 30px numbers over tracked uppercase captions, with a 40px lead figure. `.board` is the hairline grid of `.srow` — a `5px 1fr auto` grid where the first column is a 5px line-ink bar, the middle carries the condensed subject name in its line ink plus a status line coloured ok/warn/bad, and the right carries a 27px percentage. Each row's 4px track fills in line ink and carries a 1px `--ink-3` tick standing at the 75% mark: the threshold is drawn on the bar, not just stated.

### Catch-up Banner (`.cu`)
The only surface bordered in `--warn`: a plate card, 12px radius, 13×15px padding, body copy in `--ink-2` with `--ink` bold for the count, and a text link pushed to the right edge. It opens `.cud`, a scrolling (max 46vh) hairline grid of day rows carrying a compact mark strip, with completed days at 0.5 opacity.

### Inputs / Fields
- **Field** (`.field`): a tracked uppercase micro-label above a plate input with a `--rule` border and 10px radius; hover shifts the border to `--rail`; hints sit below in `--ink-3`, error hints in `--bad` at weight 600. On phones the input steps up to 16px to defeat iOS zoom.
- **Contact field** (`.cfield`): a horizontal row — icon, floating micro-label over a borderless transparent input, and a 7px status dot. Plate-2 at 13px radius; `:focus-within` moves to plate-3 with a `--rail` border; the `.filled` state reveals the `--ok` dot and tints the icon (Blue Line for email/mobile).
- **Date input**: plate, `--rule`, 9px; the calendar picker indicator is filtered to a neutral grey in dark theme and left native at 0.5 opacity in light.
- **Focus**: every focusable element gets `outline: 2px solid var(--focus)` at a 3px offset with a 3px radius — the Blue Line, never a browser blue.

### Navigation (`.nav`)
Six destinations. On phone: fixed to the bottom edge, a six-column grid over a blurred ground wash with a `--rule` top border and safe-area padding; each item is a 26px stroked SVG over a 10px uppercase label at `--ink-3`; the active item goes `--ink` and grows a 28×3px Red Line tab that scales in from the top edge over 0.32s; pressing scales the item to 0.93. Above 980px the same bar becomes a 212px left rail with row-oriented items, 9px radii, a plate background on the active item, and the Red Line indicator rotated to a 3×22px left edge mark.

### Top Bar (`.top`)
Sticky, 30 z-index, blurred ground wash with a `--rule-soft` bottom border and safe-area top padding. Carries the section mark (an 11px Red Line bullet plus tracked condensed caps), a spacer, the batch segment, an icon button, and the user pill (a 999px plate pill with a Red Line avatar disc and a truncated name that hides below 560px).

### Dialogs and Sheets
`<dialog>`: plate, 16px radius, max-width 440px, `--lift-lg`, no padding on the element and 20×22px on the inner `.d-in`; entry animates 0.34s from 14px down and 0.98 scale; the backdrop is a 72% ground wash with a 4px blur. Content is a badge row, a condensed 29px subject name in its line ink, and `.d-rows` — label/value rows split left-right with `--rule-soft` top borders and tracked uppercase labels. `dialog.sheet` widens to 520px and, below 560px, docks to the bottom edge full-width with a 24px top radius, a 40×4px grab handle, a 92vh scrolling body, and a sticky save footer that fades out over a plate gradient.

### Travelcard (`.tcard`)
The first-run identity object: a credit-card aspect ratio (1.586) on plate-2 with a 15px radius, carrying a Red Line brand dot and tracked caps at the top, the student's name in condensed 28px at the bottom, and a 5px stripe strip flush to the bottom edge showing all nine line colours. The gate screen above it repeats that mark as `.hero-lines` — nine 6px bars that animate in one at a time, 40ms apart.

### Gate and Lock (`.gate`, `.lock`)
Full-viewport ground-coloured overlays (z-index 100 and 120) with safe-area padding. The gate stacks the hero mark, the travelcard, and the form; below 560px it becomes a column flex so the form drops to the thumb. The lock is a centred 320px column with a 44px Red Line icon, a 27px condensed heading, `--ink-2` copy, and a full-width CTA.

### Plan Bar (`.planbar` / `.psum` / `.pdelta`)
The leave-planning readout: a plate card, 12px radius, 14×16px padding, holding a condensed 30px figure inline with `--ink-2` supporting text and a delta line below that turns `--bad` at weight 600 when the plan costs you the threshold.

### Boot Sequence and Page Entry
The launch animation is the thesis, not a logo fade: `.railwrap.boot` draws the travelled rail down with `railDraw` (0.82s, scaleY from 0, 0.1s delay), the stations arrive behind it with `stationIn` (0.5s, 11px rise, staggered by `calc(var(--i) * 52ms + 60ms)`), and the live marker lands last with `markerLand` (0.46s, scale 0.35 → 1, 0.62s delay). The class is removed after 1.6s and nothing waits on it. Every other view enters with `.enter > *` playing `rise` (0.5s, 9px, opacity) staggered 40ms per child and capped at the seventh. The gate adds `lineIn` (0.5s scaleX) across its nine hero bars at 40ms intervals. All of it lives inside `@media (prefers-reduced-motion: no-preference)`, and a `reduce` block collapses every animation and transition in the document to 0.001ms.

### Theming
Two mechanisms, one token layer. The dark set is authored in `:root`; the light set is authored twice — once under `@media (prefers-color-scheme: light)` scoped to `:root:not([data-theme="dark"])`, and once under `:root[data-theme="light"]` for the explicit override — so system preference and manual choice produce identical output. Light theme re-tints the nine line inks to higher-contrast print values, flips `--badge-ink` from near-black to white, re-authors all three shadows in navy-tinted ink, and re-points `--focus` at the light Blue Line. `<meta name="theme-color">` carries both grounds. Nothing outside the token block is theme-aware.

### Native Shell (Capacitor Android, `in.adgips.secf`)
The same file ships as an Android app, and the native layer only contributes what the web layer cannot. The status bar is overlaid rather than avoided (`StatusBar.setOverlaysWebView({overlay:true})`) with its icon style set from the resolved `--bg`, so the app draws edge to edge and the CSS safe-area padding is what keeps the top bar clear of the clock. The window background and the pre-Android-12 launch drawable are both painted in the app's own ground with a 26dp Red Line station disc centred on it, so launch and first paint are the same surface instead of Capacitor's white splash. Touch feedback runs through a custom `SoftHaptics` plugin built on Android's `performHapticFeedback` rather than the vibrator motor: a `CLOCK_TICK` for ordinary taps, `VIRTUAL_KEY` for primary buttons, and `CONFIRM`/`REJECT` for completions and refusals — order-of-magnitude shorter than a driven buzz and obedient to the system haptic strength setting. Haptics are suppressed entirely under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** bind subject colour with a `data-line` attribute and read it through `var(--line)`; never hardcode a line hex on a component.
- **Do** keep line ink to rails, discs, bars, badges, gauge fills, and subject titles; the reading field stays achromatic.
- **Do** draw station discs as `--bg` fills with an inset ring (`box-shadow: inset 0 0 0 3px var(--line)`).
- **Do** use Blinker for signage and figures, and Blinker for anything that is a sentence.
- **Do** track out every uppercase run (0.09–0.16em) and keep all figures tabular.
- **Do** separate lists with 1px grid gaps over `--rule-soft` inside a 12px clipped container.
- **Do** step down the plate stack (plate → plate-2 → plate-3) for nested surfaces instead of adding a shadow.
- **Do** author every new colour three times: `:root`, the `prefers-color-scheme: light` block, and `[data-theme="light"]`.
- **Do** use `--ease` (`cubic-bezier(.16,1,.3,1)`) at 0.15–0.34s for state changes, and put every non-essential animation inside `@media (prefers-reduced-motion: no-preference)`.
- **Do** size free periods to their real duration, and dash them.
- **Do** add safe-area insets to anything pinned to a screen edge, and measure the top bar into `--top-h` rather than hardcoding its height.
- **Do** keep interactive elements real `<button>`/`<a>` with `aria-pressed` or `aria-current`, and let the Blue Line focus ring stand.

### Don't:
- **Don't** flood a card or a text block with a line colour, and don't colour body copy.
- **Don't** fall back to the Red Line for an unassigned element — the fallback is `--ink-2`.
- **Don't** add a shadow to a surface that is merely nested; shadows belong to floating layers only (`--lift`, `--lift-lg`, `--lift-edge`).
- **Don't** introduce a browser-blue focus ring, a rendered scrollbar track, or a tap-highlight flash; all three are suppressed deliberately.
- **Don't** set condensed type in running prose, or set uppercase at default tracking.
- **Don't** draw a diagonal or a curve in the diagram layer; rails and bars are orthogonal.
- **Don't** animate the gauge or the clock with an eased curve — clock-driven fills use `linear`; only interface state uses `--ease`.
- **Don't** introduce a third stroke style; solid means scheduled, dashed means void.
- **Don't** hardcode a light-theme value inside a component rule; theming happens at the token layer only.
- **Don't** adopt Android's native design language in the wrapped build — the native layer contributes ground colour, insets, and haptics, never Material components.
