# Bunkr — security audit & production readiness

Audited 6 Sep 2026 against the working tree at `8dbd540` + uncommitted changes.
Scope: Supabase schema and RLS, the single-file client, the OTA loader, the
Capacitor/Android wrapper, the Vercel deploy.

Threat model this is written against: **sixty classmates who all have the app,
can read every line of its source, and have a reason to want a higher
percentage than they earned.** Not a nation state. That model is what makes the
findings below sharp — the attacker here is not hypothetical, they are on the
roster.

---

## Fixed in this pass

### 1. CRITICAL — any student could make themselves CR
`01-students-setup.sql` granted `update` on **the whole `students` table** to
`authenticated`. RLS is row-level, not column-level, so the `update own row`
policy authorised writing *any column* of your own row. PostgREST exposes that
directly:

```
PATCH /rest/v1/students?sno=eq.<your own sno>
{"role":"cr"}
```

One request, from the browser console, with the publishable key that ships in
the page. And `role = 'cr'` is the gate on `cr_release()`, which unclaims any
student's row and nulls their phone number, email and socials. So the escalation
path was: any student → CR → wipe the identity and contacts of all 59 others.

**Fixed** by replacing the table grant with a column grant covering exactly what
the client writes — `present, held, updated_at, attendance_cleared_at, github,
linkedin, instagram, mobile, email`. `role`, `name`, `batch`, `sno`, `username`,
`claimed_by`, `claimed_at` and `active_device_*` are now unwritable from a user
token. Every legitimate path to them goes through a `security definer` function
that runs as the table owner and is unaffected.

Files: `supabase/01-students-setup.sql`, `supabase/06-hardening.sql` (STEP 1).

### 2. HIGH — the section directory was readable by the whole internet
`public.directory` exposes `mobile` and `email` for all 60 students and was
granted to `authenticated`. A Postgres view runs as its **owner**, so it does
not see the `students` RLS policies at all. Sign-up is open and unrestricted, so
anyone anywhere could register an account with any email address and read every
student's personal phone number.

**Fixed:** the view now requires the caller to have claimed a roster row —
`exists (select 1 from students me where me.claimed_by = auth.uid())`. You see
the section once you are in the section. An account that signed up but never
claimed a name gets zero rows, which `renderDirectory()` already degrades
gracefully on (`renderDirectory()` — it falls back to names-only).

Files: `supabase/05-features-setup.sql`, `supabase/06-hardening.sql` (STEP 2).

### 3. HIGH — running the SQL files in their numbered order breaks the leaderboard
`01` and `04` each create a view named `public.leaderboard_ranks`, over different
tables, with different columns. `04` has the higher number so it wins — and its
version has no `batch` column, while the client asks for
`select=name,username,batch,rank` (`fetchRanks()`). A fresh setup done in
the documented order returns 400 to every student who opens Ranks.

**Fixed:** `04`'s redefinition is removed; the view lives in `01` only. `04`'s
`public.leaderboard` table is dead — nothing reads or writes it — and there is a
commented `drop` ready once you have confirmed it is empty.

Files: `supabase/04-leaderboard-setup.sql`, `supabase/06-hardening.sql` (STEP 3).

### 4. HIGH — the Android build backed the session token up to Google
`android:allowBackup="true"` (the Capacitor default). Android's cloud backup and
device-to-device transfer sweep up the WebView's data store, which holds the live
Supabase **refresh token**, the roster row and the term of marks. Restore that
backup onto a second phone and you are signed in as that student — which is
precisely what the single-active-device rule and the fingerprint lock exist to
prevent, routed around by the OS.

**Fixed:** `allowBackup="false"`, `fullBackupContent="false"`, and a
`data_extraction_rules.xml` excluding `domain="root"` from both cloud backup and
device transfer. Also set `usesCleartextTraffic="false"` explicitly.

Files: `android/app/src/main/AndroidManifest.xml`,
`android/app/src/main/res/xml/data_extraction_rules.xml`.

### 5. HIGH — there was no way to build a release APK
`npm run build` ran `assembleDebug`. A debug APK is `android:debuggable="true"`,
which lets anyone with a USB cable attach Chrome DevTools to the WebView and read
the session token straight out of `localStorage` — and makes the fingerprint lock
a decoration, since the lock is a hidden overlay, not encryption. Shipping the
debug APK to the section *was* the plan, because no other APK existed.

**Fixed:** `signingConfigs.release` reads `android/keystore.properties`
(gitignored), `npm run release` runs `assembleRelease`, and the debug build now
carries `applicationIdSuffix '.debug'` so it can never be mistaken for or
installed over the real one. See "Before you ship" below for creating the key.

Files: `android/app/build.gradle`, `package.json`, `.gitignore`.

### 6. MEDIUM — no security headers on the web deploy
`deploy/vercel.json` set only `Cache-Control` and `Access-Control-Allow-Origin: *`.
No CSP, so any injected `<script src>` would have loaded; no `frame-ancestors`,
so the app could be framed and clickjacked into marking attendance.

**Fixed:** CSP (`default-src 'self'`, `connect-src` pinned to the Supabase
project, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`),
`X-Content-Type-Options`, `Referrer-Policy: no-referrer`, HSTS,
`Permissions-Policy` and COOP. `'unsafe-inline'` stays in `script-src` because
the whole app is one inline `<script>`; that is a real limit of the single-file
design, but the CSP still blocks the usual delivery vector — pulling a payload
off a third-party origin — and pins where the app is allowed to talk.

`Access-Control-Allow-Origin: *` is **kept deliberately**: the Android WebView
runs on `https://localhost` and cross-origin-fetches the deployed HTML, so the
OTA loader needs it. The content is public anyway.

Files: `deploy/vercel.json`, `deploy/_headers`.

### 7. MEDIUM — `production-reset.sql` was one paste away from erasing the term
It `truncate`s `public.attendance`: a whole semester of marks entered by hand,
one class at a time, by sixty people, with no backup on the free tier. It sat in
the same folder as the run-me files with nothing distinguishing it.

**Fixed:** it now opens with a `raise exception` block that must be deleted by
hand before it will run.

File: `supabase/production-reset.sql`.

### 8. LOW — username had no server-side format constraint
`claim_student()` validated the format, but the column itself did not, and
before fix #1 the column was reachable by a raw `PATCH`. Added a check
constraint mirroring the client regex. Also gave `cancellations.by_user` a
`default auth.uid()`.

File: `supabase/06-hardening.sql` (STEPS 4–5).

### 9. BLOCKER (not security, found on the way) — one unclosed `<div>` killed every dialog
The "made with ♥" footer added to the gate opened `<div class="gate-foot">`
inside `#vConflict` and then consumed that view's own closing tag. The body was
left one `</div>` short, so `#lockScreen` and `<dialog id="dlg">` became
**children of `#gate`** instead of its siblings.

`#gate` carries `hidden` whenever a student is signed in, and the stylesheet says
`[hidden] { display:none !important; }`. So for every signed-in user — that is,
everyone, all the time — the app-lock screen and every dialog in the app were
inside a `display:none` ancestor and could not render. Contact cards, the
onboarding queue, the bunk planner sheet: all of them open by `showModal()`, and
none of them would have appeared.

**Fixed:** `#vConflict` is closed properly and `.gate-foot` moved out to sit
under whichever view is showing, which is where it was meant to be anyway (it
was only ever going to appear on the "Device in use" screen). Both footer links
also gained `noreferrer` alongside `noopener`.

File: `timetable.html`.

---

## Not fixed — needs your decision

### A. The OTA loader is remote code execution by design
`boot/index.html` fetches `https://deploy-hazel-three-81.vercel.app/index.html`
on every launch and `document.write()`s it into the WebView. Whatever that URL
serves *is* the app: full access to session tokens, contacts and the biometric
lock, on every installed phone, with no rebuild and no user action.

The only integrity check is `sane()` — length > 100000 and the presence of an
HTML comment. That is a captive-portal guard, not a signature. Anyone who can
serve that URL owns every install.

Two things make that more than theoretical:

1. **The hostname is an auto-generated `*.vercel.app` subdomain.** If the Vercel
   project is ever deleted, renamed, or the account lapses, the name goes back in
   the pool and someone else can claim it. That is a documented subdomain-takeover
   path, and here it lands as code execution on sixty phones.
2. **Google Play forbids it.** Downloading and executing interpreted code from
   outside Play violates the Device and Network Abuse policy. If you ever list
   the app, this is what gets it pulled.

Three ways out, cheapest first:

- **Keep OTA, sign the payload.** Generate an Ed25519 keypair, keep the private
  key offline, hardcode the public key in the loader, publish `index.html.sig`
  next to `index.html`, and have the loader verify with `crypto.subtle.verify`
  before `run()`. About fifteen lines in the loader and one signing step per
  deploy. This is the fix I would take: it keeps the property you built it for
  (a push reaches the section without anyone reinstalling) and removes the
  origin-compromise and subdomain-takeover paths entirely.
- **Keep OTA, own the name.** Point `LIVE` at a custom domain you control and
  renew. Closes takeover, not origin compromise.
- **Drop OTA.** Ship `app.html` only, update through APK reinstalls. Safest,
  and loses the thing the loader was built for.

Say which and I will implement it.

### B. The leaderboard is self-reported and always will be
`pushScore()` sends `present` and `held` computed on the device. A student can
send any pair they like — the fix in #1 stops them writing `role`, not their own
totals. The server cannot check them because the marks *are* the student's own
claim; there is no attendance register to reconcile against.

This is inherent to the design, not a bug, but the Ranks screen should not be
presented as authoritative. If it ever needs to be, the totals have to be
derived server-side from `public.attendance` (a trigger or a scheduled
recompute) rather than accepted from the client — and even then a student can
mark themselves present for a class they missed.

### C. Single-active-device is a courtesy, not a control
`heartbeatDevice()` evicts by *asking the client to sign itself out*
(`heartbeatDevice()`). A modified client ignores it. Two smaller notes:
- on eviction the client drops the local session but never calls
  `/auth/v1/logout`, so the refresh token stays valid server-side;
- `check_device` is fine, but `claim_device` lets the newest caller take the
  slot unconditionally.

Fine for the actual threat (a shared phone, a forgotten sign-out). Just don't
describe it as security in the README.

### D. Confirm Supabase project settings in the dashboard
Not visible from the repo — check these by hand before launch:
- **Email confirmation is ON.** `signUp()` assumes it
  (it throws "Check your email to confirm" when no token comes back), but if the
  setting is off, sign-up hands out a session immediately and the "claim your
  name" step becomes claimable by anyone with any email address.
- **Auth rate limits** are at defaults or tighter.
- **Leaked-password protection** is on.
- **The `service_role` key has never been in a browser.** It is not in this repo
  or its git history — I checked — keep it that way.
- **Point-in-time recovery / a backup.** There is none on the free tier. A term
  of hand-entered marks with no backup is the single largest non-security risk in
  this project.

---

## Before you ship

1. **Run `supabase/06-hardening.sql`** in the SQL editor, as one script. Confirm
   STEP 6 prints the nine update columns and a `batch` column on
   `leaderboard_ranks`. Until this runs, finding #1 is live.
2. **Create the release keystore** — once, and back it up somewhere you will
   still have in three years:
   ```
   keytool -genkey -v -keystore android/bunkr-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias bunkr
   ```
   Then `android/keystore.properties` (already gitignored):
   ```
   storeFile=app/../bunkr-release.jks
   storePassword=…
   keyAlias=bunkr
   keyPassword=…
   ```
   Build with `npm run release`.
3. **Decide on the OTA loader** (finding A). Do not ship to sixty phones without
   deciding — it is the largest single risk in the project.
4. **Run `python3 check.py`** before every `npm run prep`. It asserts the things
   that have actually broken here: the `<div>` balance and that `#lockScreen` and
   `<dialog>` stay outside `#gate`, that `students` has no table-wide UPDATE
   grant and `role` is not grantable, that `leaderboard_ranks` is defined once
   and carries `batch`, that the reset script is still armed, that
   `allowBackup` is false, that the bundle copies match `timetable.html`, and
   that the loader's `LIVE` url points at a file that exists and carries the
   `<!--secf-app-->` marker. It needs nothing installed.
5. **Bump `versionCode`** past 1 for anything after the first install.
6. **Take the section off the public roster if you can.** `public.roster` and
   `public.leaderboard_ranks` are granted to `anon`, so 60 real names, usernames
   and batches are readable by anyone with the URL. `roster` genuinely needs it —
   it is the pick-your-name screen, shown before sign-in. `leaderboard_ranks`
   does not: it is only ever rendered to someone signed in. Moving it to
   `authenticated` is a one-word change in the grant plus passing a token at
   `fetchRanks()`. No percentages are exposed either way.

## Checked and clean

- **No XSS.** All ten `innerHTML` sites take static or numeric strings
  — icon paths, a submission count, an "all present" label. Everything
  user-controlled goes through `el()`, which uses `textContent`. The directory and ranks screens build every node that way.
- **No `javascript:` URL injection** through contact links. All five `CONTACTS`
  href builders (`CONTACTS`) prefix a scheme, and the one that accepts a full URL
  (LinkedIn) gates on `/^https?:/`. External links carry
  `rel="noopener noreferrer"`.
- **No secrets in the repo or its history.** No `service_role` key, no JWT
  secret, no keystore, no `local.properties`. `.env*` is gitignored and untracked.
  The `sb_publishable_…` key in `CLOUD` is meant to be public.
- **`attendance` RLS is correct.** Own-row select/insert/update/delete, `anon`
  revoked, `user_id` defaults to `auth.uid()` so the client cannot set it, and
  `updated_at` is stamped by a trigger rather than trusted from the phone's clock.
- **`claim_student()` cannot be raced.** The `where sno = ? and claimed_by is
  null` makes first-committer-wins, and it can only ever assign the caller's own
  `auth.uid()`.
- **Every `security definer` function sets `search_path = public`**, which closes
  the standard definer-hijack.
- **Password reset scrubs the fragment** from the address bar via
  `history.replaceState` before anything else (`recoveryFromHash()`).
- **Sign-out kills the refresh token server-side** (`signOut()`), which matters on a
  shared phone.
- **The gate is `inert`**, so the keyboard cannot walk out of the sign-in form
  into the app behind it (`behind()`).
