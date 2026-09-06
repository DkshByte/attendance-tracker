#!/usr/bin/env python3
"""Pre-deploy self-check. Run `python3 check.py` before `npm run prep`.

Every assert here is a bug that actually shipped or nearly shipped once.
No framework on purpose: this has to run on a laptop with nothing installed.
"""
import re, sys, pathlib

root = pathlib.Path(__file__).parent
fail = []
def check(name, cond, why=""):
    line = ("PASS  " if cond else "FAIL  ") + name + ("" if cond else "  — " + why)
    print(line)
    if not cond: fail.append(line)

html = (root / "timetable.html").read_text()
body = html[html.index("<body"):]

# 1. An unclosed <div> once put #lockScreen and <dialog> inside #gate, which is
#    [hidden] whenever you are signed in — so no dialog in the app could open.
opens, closes = len(re.findall(r"<div\b", body)), len(re.findall(r"</div>", body))
check("div tags balance", opens == closes, f"{opens} <div> vs {closes} </div>")

def closes_at(open_line_pred):
    lines, depth, start = html.split("\n"), 0, None
    for i, l in enumerate(lines, 1):
        if start is None and open_line_pred(l): start = i
        if start is None: continue
        depth += len(re.findall(r"<div\b", l)) - len(re.findall(r"</div>", l))
        if depth == 0 and i > start: return start, i
    return start, None

gate_open, gate_close = closes_at(lambda l: '<div class="gate" id="gate"' in l)
lock_line = next(i for i, l in enumerate(html.split("\n"), 1) if 'id="lockScreen"' in l)
dlg_line  = next(i for i, l in enumerate(html.split("\n"), 1) if '<dialog id="dlg"' in l)
check("#gate closes", gate_close is not None, "the gate div is never closed")
check("#lockScreen is outside #gate", gate_close and lock_line > gate_close,
      "it would inherit [hidden]{display:none} and never show")
check("<dialog> is outside #gate", gate_close and dlg_line > gate_close,
      "showModal() cannot render inside a display:none ancestor")

# 2. Nothing may be pulled from a third origin: the app is one self-contained file.
check("no external <script src>", not re.search(r'<script[^>]+src=', html),
      "an off-origin script would defeat the CSP and the single-file design")

# 3. A student must not be able to PATCH role='cr' onto their own row.
sql = (root / "supabase" / "01-students-setup.sql").read_text()
check("students UPDATE is column-scoped",
      not re.search(r"grant[^;]*\bupdate\b\s+on\s+public\.students\s+to", sql, re.I),
      "a table-wide UPDATE grant lets any student write role='cr'")
check("role is not a grantable column",
      not re.search(r"grant\s+update\s*\([^)]*\brole\b", sql, re.I),
      "role must only be settable by the owner")

# 4. leaderboard_ranks must exist exactly once, and must carry `batch`
#    (the client selects it; two incompatible definitions once returned 400).
defs = sum(len(re.findall(r"create view public\.leaderboard_ranks", f.read_text()))
           for f in sorted((root / "supabase").glob("0[1-5]-*.sql")))
check("leaderboard_ranks defined once in 01-05", defs == 1, f"found {defs} definitions")
check("leaderboard_ranks has batch", "batch" in sql[sql.find("create view public.leaderboard_ranks"):][:600],
      "the client selects batch; a view without it 400s")

# 5. The destructive reset must stay armed.
reset = (root / "supabase" / "production-reset.sql").read_text()
check("production-reset.sql is armed", "raise exception" in reset[:1500],
      "it truncates a term of hand-entered marks with no backup")

# 6. The Android build must not hand localStorage to Google's backup.
mf = (root / "android/app/src/main/AndroidManifest.xml").read_text()
check('allowBackup="false"', 'android:allowBackup="false"' in mf,
      "backup/restore copies the live Supabase refresh token to another phone")

# 7. What is deployed must be what was reviewed, and the loader must point at it.
for rel in ("deploy/app.html", "boot/app.html"):
    if (root / rel).exists():
        check(f"{rel} in sync", (root / rel).read_text() == html, "run `npm run prep`")

loader = (root / "boot/index.html").read_text()
m = re.search(r'var LIVE\s*=\s*"([^"]+)"', loader)
check("loader LIVE url found", bool(m), "boot/index.html no longer declares LIVE")
if m:
    served = m.group(1).rsplit("/", 1)[-1]
    check(f"loader points at a file that exists in deploy/ ({served})",
          (root / "deploy" / served).exists(),
          f"deploy/{served} is missing — every launch would fall back to the bundled copy")
    check("what the loader fetches carries the sanity marker",
          "<!--secf-app-->" in (root / "deploy" / served).read_text()
          if (root / "deploy" / served).exists() else False,
          "sane() rejects it and the OTA path silently never updates")

# 8. The OTA path is only debuggable if you can see which copy is running, and only
#    recoverable if a stuck phone can force a refetch. Both have shipped broken once.
m = re.search(r"<!--build:([^>]+)-->", html)
check("app carries a build stamp", bool(m),
      "no way to tell from a screenshot which copy a phone is running")
if m:
    # The stamp is derived, so it can be recomputed. If it does not match, someone
    # edited the app and shipped without `npm run prep` — and the footer is now lying
    # about which copy is running, which is worse than having no stamp at all.
    import hashlib, json as _json
    want = hashlib.sha256(
        re.sub(r"<!--build:[^>]*-->", "<!--build:-->", html).encode()).hexdigest()[:7]
    ver = _json.loads((root / "package.json").read_text())["version"]
    check("build stamp matches the file it is stamped on", m.group(1) == f"{ver}+{want}",
          f"stamp says {m.group(1)}, content is {ver}+{want} — run `npm run prep`")
check("app clears the loader's fail counter on a good boot",
      'removeItem("adgips-app-fails")' in html,
      "the counter only ever climbs, so the OTA path stops updating for good")
check("loader counts failures before rolling back",
      "adgips-app-fails" in loader and "GIVEUP" in loader,
      "one backgrounded launch is enough to block an update")
check("app offers a way to force a refetch",
      'id="buildRefresh"' in html,
      "a phone stuck on a bad copy can only be fixed by reinstalling")

# 8b. The CR's verdict changes everyone's percentage, so writing one must be locked to
#     the CR at the database and not merely hidden in the UI.
ovr = (root / "supabase/07-overrides-setup.sql").read_text()
check("class_overrides has RLS enabled",
      "alter table public.class_overrides enable row level security" in ovr,
      "without it any signed-in student can cancel a class for the whole section")
for op in ("insert", "update", "delete"):
    pol = re.search(rf"for {op}\s+(?:using|with check)[\s\S]*?;", ovr)
    check(f"class_overrides {op} is gated on is_cr()",
          bool(pol) and "public.is_cr()" in pol.group(0),
          f"{op} would be open to anyone signed in")
check("class_overrides is not granted to anon",
      "revoke all on public.class_overrides from anon" in ovr,
      "the publishable key is public, and the note is free text")

# 9. The download buttons must point at an asset that exists. The landing page spent a
#    release pointing at a filename the release did not have.
landing = (root / "deploy/landing.html").read_text()
apk_links = set(re.findall(r'https://github\.com/[^"\s]+?\.apk', landing + html))
check("every APK link uses releases/latest/download/bunkr.apk",
      apk_links == {"https://github.com/DkshByte/attendance-tracker/releases/latest/download/bunkr.apk"},
      f"a pinned or misnamed asset 404s: {sorted(apk_links)}")

print()
if fail:
    print(f"{len(fail)} check(s) failed.")
    sys.exit(1)
print("all checks passed.")
