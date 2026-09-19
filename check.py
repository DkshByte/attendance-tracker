#!/usr/bin/env python3
"""Pre-deploy self-check. Run `python3 check.py` before `npm run prep`.

Every assert here is a bug that actually shipped or nearly shipped once.
No framework on purpose: this has to run on a laptop with nothing installed.
"""
import json, re, sys, pathlib

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

# 1b. The whole app is one inline script: a single duplicate `const` is a SyntaxError that
#     leaves the splash on screen forever. That nearly shipped once; parse it before deploying.
import shutil, subprocess, tempfile
scripts = re.findall(r"<script>([\s\S]*?)</script>", html)
if shutil.which("node"):
    bad = []
    for i, src in enumerate(scripts):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
            f.write(src)
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
        if r.returncode:
            bad.append(f"script {i}: " + (r.stderr.strip().splitlines() or ["?"])[-1])
    check("every inline app script parses", not bad, "; ".join(bad))

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

# 8b'. Holidays and the term end change every student's budget, so the same lock applies.
crc = (root / "supabase/08-cr-controls.sql").read_text()
for tbl, ops in (("cr_holidays", ("insert", "update", "delete")), ("term", ("insert", "update"))):
    check(f"{tbl} has RLS enabled", f"alter table public.{tbl} enable row level security" in crc,
          "without it any signed-in student can rewrite the calendar")
    body = crc[crc.find(f"create table if not exists public.{tbl}"):]
    body = body[:body.find("-- ---------- STEP", 10)]
    for op in ops:
        pol = re.search(rf"for {op}\s+(?:using|with check)[\s\S]*?;", body)
        check(f"{tbl} {op} is gated on is_cr()", bool(pol) and "public.is_cr()" in pol.group(0),
              f"{op} would be open to anyone signed in")
    check(f"{tbl} gives anon read only", f"grant select on public.{tbl} to anon;" in body
          and not re.search(rf"grant[^;]*(insert|update|delete)[^;]*public\.{tbl} to anon", body),
          "the publishable key is public")

# 8b''. Notices are CR free text and the handover function can hand out every CR power.
n09 = (root / "supabase/09-notices-and-fixes.sql").read_text()
check("notices has RLS enabled", "alter table public.notices enable row level security" in n09,
      "any signed-in student could post to the whole section")
for op in ("insert", "delete"):
    pol = re.search(rf"on public\.notices\s+for {op}\s+(?:using|with check)[\s\S]*?;", n09)
    check(f"notices {op} is gated on is_cr()", bool(pol) and "public.is_cr()" in pol.group(0),
          f"{op} would be open to anyone signed in")
check("notices is not granted to anon", "revoke all on public.notices from anon" in n09,
      "the publishable key is public, and the body is free text")
fn = n09[n09.find("function public.cr_set_role"):]
check("cr_set_role refuses non-CRs first", "if not public.is_cr()" in fn[:400],
      "any student could make themselves CR")
check("cr_set_role keeps at least one CR", "make someone else CR first" in fn,
      "the last CR could remove themselves and nobody could run the section")
check("attendance accepts the cleared mark 'X'", "('P','A','C','X')" in n09,
      "the app writes 'X' when a mark is cleared; without it every clear fails")

# 8b'''. A mark is keyed by its position in the day, a verdict by its period. Mixing them
#        called off the wrong subject on every day but Wednesday.
check("tally maps a mark's position to its period", "periodOf(iso, +id.slice(bar + 1))" in html,
      "CR verdicts would land on the wrong class")

# 8b4. No signal is not a signed-out student. token() once wiped the session on any
#      error, so an expired session in a basement lab hid the timetable behind sign-in.
tok = html[html.find("async function token()"):][:900]
check("token() keeps the session on a network error", "if (e.status)" in tok,
      "a TypeError from no signal would sign the student out")

# 8c. Every cloud feature reaches Supabase through bunkr.website, because Indian ISPs
#     sinkhole supabase.co outright. Naming the host again would work on the machine of
#     whoever changed it and fail silently for the whole section.
vj = json.loads((root / "deploy/vercel.json").read_text())
rw = {r["source"]: r["destination"] for r in vj.get("rewrites", [])}
for pfx in ("/auth/v1", "/rest/v1"):
    src = f"{pfx}/:path*"
    check(f"{pfx} is proxied by vercel.json",
          src in rw and "supabase.co" in rw[src],
          "the app would have to name supabase.co, which students cannot resolve")
check("the app does not name supabase.co as its API host",
      not re.search(r'url:\s*"https://\w+\.supabase\.co"', html),
      "CLOUD.url must stay same-origin (or bunkr.website on native) or the block applies again")
check("CSP does not need the supabase host",
      "supabase.co" not in vj["headers"][0]["headers"][2]["value"],
      "a connect-src naming the blocked host is dead config")

# 9. The download buttons must point at an asset that exists. The landing page spent a
#    release pointing at a filename the release did not have.
landing = (root / "deploy/landing.html").read_text()
apk_links = set(re.findall(r'https://github\.com/[^"\s]+?\.apk', landing + html))
check("every APK link uses releases/latest/download/bunkr.apk",
      apk_links == {"https://github.com/DkshByte/attendance-tracker/releases/latest/download/bunkr.apk"},
      f"a pinned or misnamed asset 404s: {sorted(apk_links)}")

# 10. Nobody sees the app signed out. A "just see the timetable" link and a signed-out
#     boot that skipped the gate once opened it to anyone with the URL.
check("signed-out boot shows the sign-in gate",
      'if (!t) { renderAll(); return gateShow("login"); }' in html,
      "a signed-out start must land on the sign-in wall")
check("no way past the gate without signing in",
      "liSkip" not in html,
      "a skip link on the sign-in form lets anyone read the app")
check("no tap overlay covers the profile button",
      ".user-pill::after" not in html,
      "a ::after on .user-pill sits over #pillBtn and swallows taps, so the menu never opens")
# 9c. Every table the app writes carries a per-account limit, and the app names it.
rl = (root / "supabase/10-rate-limits.sql").read_text() if (root / "supabase/10-rate-limits.sql").exists() else ""
for tbl in ("attendance", "students", "cancellations", "notices", "class_overrides", "cr_holidays", "term"):
    check(f"{tbl} writes are rate limited", f"('{tbl}'," in rl,
          "a script or a stuck loop could write without limit")
check("rate limits raise PT429 (HTTP 429)", "errcode = 'PT429'" in rl, "any other code reaches the app as a 400/500")
check("the app explains a rate limit", 'c === "PT429"' in html, "a limited write would fail with a raw database message")
# 9d. Google sign-in: a return is only trusted if this tab started it, the token is bound
#     to a nonce only this tab knows, and the flow never runs inside the Android webview.
check("Google return checks the saved state", "saved.state !== h.get(\"state\")" in html,
      "a crafted link could sign a student into someone else's Google account")
check("Google nonce is hashed for Google and sent raw to Supabase",
      'crypto.subtle.digest("SHA-256"' in html and "nonce: g.raw" in html,
      "without the nonce binding a lifted id_token could be replayed")
check("Google never loads its web page inside the app", "GOOGLE_CLIENT_ID && (!NATIVE || nativeGoogle())" in html and "if (NATIVE) {" in html,
      "Google refuses its sign-in page inside embedded webviews; the app must use the native picker")
check("native Google sign-in binds the nonce too", "SL.login({ provider: \"google\", options: { nonce } })" in html and "googleFinish({ idToken, raw })" in html,
      "a native id_token without the nonce could be replayed")
check("privacy policy discloses Google sign-in", "Continue with Google" in (root / "deploy/privacy.html").read_text(),
      "a new data flow the policy doesn't mention")
# The leaderboard is opt-in, and this project has already shipped the bug where
# a later-numbered file redefines leaderboard_ranks and quietly wins: 04 beat 01,
# then 06 had to beat 04. A third one without the filter would put every hidden
# student back on the board with no UI showing it. So: whoever defines it last
# has to carry the filter.
lb_defs = sorted(f for f in (root / "supabase").glob("*.sql")
                 if "create view public.leaderboard_ranks" in f.read_text())
last_lb = lb_defs[-1].read_text() if lb_defs else ""
check("the last word on leaderboard_ranks filters on on_leaderboard",
      "and on_leaderboard" in last_lb,
      "the highest-numbered definition wins, and one without the filter shows every hidden student")
check("a student may write their own on_leaderboard",
      "grant update (on_leaderboard)" in (root / "supabase/11-leaderboard-optin.sql").read_text(),
      "06 revoked the table-wide update grant, so the switch silently fails without a column grant")
check("the app reads on_leaderboard onto the profile",
      "held,on_leaderboard,github" in html and "profile.on_leaderboard" in html,
      "the switch would always render Show me, whatever the row actually says")
check("a released roster row goes back to hidden",
      "on_leaderboard = false" in (root / "supabase/11-leaderboard-optin.sql").read_text()
      and "on_leaderboard        = false" in reset,
      "the next student to claim that name inherits a visible board row they never asked for")

router = (root / "deploy/index.html").read_text()
check("the root router forwards reset links to the app with their token",
      "access_token" in router and 'app.html" + window.location.hash' in router,
      "Supabase sends reset links to the Site URL; a router that drops the # loses the token")
check("password reset always returns to the live web app",
      'RESET_TO = "https://www.bunkr.website/app.html"' in html and "redirect_to=\" + encodeURIComponent(RESET_TO)" in html,
      "a reset from the APK or a preview domain lands off Supabase's redirect allow-list")
# 20. A rename of the landing page's demo subjects once replaced the SUB keys too, not
#     just the display names, so board(), planRows() and the calculator all looked up
#     subjects that did not exist and the whole page died on load with a blank screen.
lmain = (root / "deploy/landing-main.js").read_text()
sub_keys = set(re.findall(r"^\s{4}(\w+):\s*\{ n:", lmain, re.M))
used = set(re.findall(r'pick\("(\w+)"\)', lmain)) | set(re.findall(r'picked = "(\w+)"', lmain))
for arr in re.findall(r'(?:var keys = |return )\[((?:"\w+", ?)+"\w+")\]\.', lmain):
    used |= set(re.findall(r'"(\w+)"', arr))
check("every subject the landing page looks up actually exists",
      bool(sub_keys) and bool(used) and used <= sub_keys,
      f"{sorted(used - sub_keys)} is not a key in SUB — the page throws on load and renders nothing")

loader = (root / "boot/index.html").read_text()
check("the APK loader fetches www, not the apex",
      '"https://www.bunkr.website/app.html"' in loader,
      "bunkr.website 308s to www with no CORS header, so OTA fails and phones stay old")

print()
if fail:
    print(f"{len(fail)} check(s) failed.")
    sys.exit(1)
print("all checks passed.")
