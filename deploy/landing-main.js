/* Bunkr landing. The devices are not pictures: every screen is drawn here from one
   demo model, so marking a class on the phone moves the laptop's numbers, the bunk
   plan and the calculator together, the way the app does. Around that, a small 3D
   rig: devices on real depth, pointer and scroll tilt, parallax rails, and an
   assembly on load that comes apart as you scroll. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ============================================================
     The model. Demo student, Tuesday 10:05, a month into term.
     ============================================================ */
  /* Every verdict the page says out loud, in one place. Slang dates faster than code:
     when "cooked" stops landing, retune here, not across the file. */
  var VOICE = {
    cooked: function (end) { return "you're cooked. Every class left still only gets you to " + end + "%."; },
    locked: "locked in. Every class left, no exceptions.",
    free:   "free. Miss every single one, still 75%.",
    spare:  function (n) { return (n === 1 ? "class" : "classes") + " you can miss and still be chilling."; },
    chip:   { ok: "Safe", warn: "Locked in", bad: "Cooked" }
  };

  var SUB = {
    BEE:   { n: "Chemistry",       line: "bee", fac: "Prof. A", p: 8,  h: 11, r: 37 },
    SMT:   { n: "Statistics",      line: "smt", fac: "Prof. B", p: 8,  h: 9,  r: 36 },
    EM:    { n: "Mechanics",       line: "em",  fac: "Prof. C", p: 9,  h: 10, r: 36 },
    EVS:   { n: "Environment",     line: "evs", fac: "Prof. D", p: 9,  h: 10, r: 36 },
    CSL:   { n: "Communication",   line: "csl", fac: "Prof. E", p: 12, h: 13, r: 34 },
    PPS:   { n: "Programming",     line: "pps", fac: "Prof. F", p: 11, h: 11, r: 37 },
    EVSP:  { n: "Environment Lab", line: "evs", fac: "Prof. D", p: 2,  h: 2,  r: 12 },
    EGL:   { n: "Design Lab",      line: "eg",  fac: "Prof. C", p: 2,  h: 2,  r: 12 },
    PHP:   { n: "Physics Lab",     line: "phy", fac: "Prof. H", p: 5,  h: 5,  r: 10 },
    PPSL:  { n: "Programming Lab", line: "pps", fac: "Prof. G", p: 4,  h: 4,  r: 11 },
    BEEL:  { n: "Chemistry Lab",   line: "bee", fac: "Prof. A", p: 2,  h: 2,  r: 12 },
    PHL:   { n: "Physics",         line: "phy", fac: "Prof. H", p: 10, h: 10, r: 37 }
  };  /* today's two marks are already inside the counts above as Present */
  var today = { CSL: "P", PHP: "P" };
  var plan = {};                                   /* pencilled skips on the plan screen */

  function counts(k) {
    var s = SUB[k], p = s.p, h = s.h, m = today[k];
    if (m === "A") p -= 1;
    if (m === "C") { p -= 1; h -= 1; }
    return { p: p, h: h, r: s.r };
  }
  /* finish on 75% missing m of r:  (p + r - m) / (h + r) >= .75 */
  function bunks(p, h, r) { return Math.max(-1, Math.min(Math.floor(p + r - 0.75 * (h + r) + 1e-9), r)); }
  var pct = function (a, b) { return b ? Math.floor(a / b * 100) : 100; };

  function summary() {
    var P = 0, H = 0, low = 0, tight = null, tb = Infinity, spread = 0;
    Object.keys(SUB).forEach(function (k) {
      var c = counts(k), b = bunks(c.p, c.h, c.r);
      P += c.p; H += c.h; spread += Math.max(0, b);
      if (pct(c.p, c.h) < 75) low++;
      if (b < tb) { tb = b; tight = k; }
    });
    return { overall: pct(P, H), low: low, tight: tight, tb: tb, spread: spread };
  }

  /* ============================================================
     Screens, drawn in the app's own vocabulary
     ============================================================ */
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var icon = function (id, cls) { return '<svg class="' + (cls || "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; };

  function top() {
    return '<div class="ui-top"><svg class="ui-logo" aria-hidden="true"><use href="#logo"/></svg>' +
      '<span class="ui-ib">' + icon("n-sun") + '</span><span class="ui-av">S</span></div>';
  }
  function nav(on) {
    return '<div class="ui-nav">' + [["n-today", "Today"], ["n-week", "Timetable"], ["n-att", "Attendance"], ["n-sec", "Section"]]
      .map(function (n, i) { return '<span class="' + (i === on ? "on" : "") + '">' + icon(n[0]) + n[1] + "</span>"; }).join("") + "</div>";
  }

  function plate() {
    return '<div class="ui-plate" data-line="phy">' +
      '<div class="ui-prow"><span class="ui-badge">In class</span><span class="ui-when"><b data-bind="left">55</b> min left</span></div>' +
      '<div class="ui-h1">Physics Lab</div>' +
      '<div class="ui-who"><b>Prof. H</b> · Lab</div>' +
      '<div class="ui-gauge"><span class="ui-track"><i data-bind="bar" style="width:50%"></i></span><span>till 11:00</span></div>' +
      '<div class="ui-next"><span class="ui-lbl">Next</span><span class="ui-val" data-line="phy">Physics</span>' +
      '<span class="ui-nf">Prof. H</span><span class="ui-at">11:30</span></div></div>';
  }
  function stats() {
    var s = summary();
    return '<div class="ui-sum">' +
      '<div><b class="ok">' + s.overall + '%</b>Overall</div>' +
      '<div><b class="warn">' + Math.max(0, s.tb) + '</b>Skips · ' + esc(SUB[s.tight].n) + '</div>' +
      '<div><b class="bad">' + s.low + '</b>Below 75%</div></div>';
  }
  function marks(k) {
    var m = today[k];
    return '<div class="ui-marks" data-k="' + k + '">' +
      [["P", "Present"], ["A", "Absent"], ["C", "Off"]].map(function (b) {
        return '<button type="button" data-m="' + b[0] + '" aria-pressed="' + (m === b[0]) + '"><i></i>' + b[1] + "</button>";
      }).join("") + "</div>";
  }
  function stop(o) {
    return '<div class="ui-stop ' + (o.cls || "") + '" data-line="' + o.line + '">' +
      '<span class="ui-node"></span>' +
      '<div class="ui-card"><div class="ui-time">' + o.t + (o.lab ? ' <span class="ui-badge ghost">Lab</span>' : "") + "</div>" +
      '<div class="ui-title">' + esc(o.n) + '</div><div class="ui-meta"><b>' + esc(o.f) + "</b> · " + (o.lab ? "Lab" : "Room 12") + "</div>" +
      (o.k ? marks(o.k) : "") + "</div></div>";
  }

  function todayScreen(still) {
    return top() + '<div class="ui-body">' +
      '<div class="ui-slot" data-slot="plate">' + plate() + "</div>" +
      '<div class="ui-slot" data-slot="stats">' + stats() + "</div>" +
      '<div class="ui-h">Today\'s classes</div>' +
      '<div class="ui-rail"><span class="ui-trav"></span><span class="ui-marker" data-line="phy"></span>' +
      stop({ cls: "past", line: "csl", t: "8:15–9:10", n: "Communication", f: "Prof. E", k: still ? null : "CSL" }) +
      stop({ cls: "live", line: "phy", t: "9:10–11:00", n: "Physics Lab", f: "Prof. H", lab: true, k: still ? null : "PHP" }) +
      '<div class="ui-lunch"><span class="ui-node big"></span>Lunch · 11:00–11:30</div>' +
      stop({ line: "phy", t: "11:30–12:25", n: "Physics", f: "Prof. H" }) +
      stop({ line: "smt", t: "12:25–1:20", n: "Statistics", f: "Prof. B" }) +
      "</div></div>" + nav(0);
  }

  var WEEK = {
    Mon: [null, ["em", "Mechanics", "Prof. C"], ["bee", "Chemistry", "Prof. A"], "L", ["pps", "Programming", "Prof. F"], ["csl", "Communication", "Prof. E"], ["evs", "Environment", "Prof. D"], null],
    Tue: [["csl", "Communication", "Prof. E"], ["phy", "Physics Lab", "Prof. H", 2], "L", ["phy", "Physics", "Prof. H"], ["smt", "Statistics", "Prof. B"], ["pps", "Programming Lab", "Prof. G", 2]],
    Wed: [["phy", "Physics", "Prof. H"], ["em", "Mechanics", "Prof. C"], ["smt", "Statistics", "Prof. B"], "L", ["pps", "Programming", "Prof. F"], ["bee", "Chemistry", "Prof. A"], ["csl", "Communication", "Prof. E"], null],
    Thu: [["pps", "Programming", "Prof. F"], ["bee", "Chemistry Lab", "Prof. A", 2], "L", ["evs", "Environment", "Prof. D"], ["bee", "Chemistry", "Prof. A"], ["phy", "Physics", "Prof. H"], ["pd", "Seminar", "Prof. E"]],
    Fri: [["smt", "Statistics", "Prof. B"], ["evs", "Environment Lab", "Prof. D", 2], "L", ["em", "Mechanics", "Prof. C"], ["evs", "Environment", "Prof. D"], ["eg", "Design Lab", "Prof. C", 2]]
  };
  var SHORT = { "Chemistry": "Chem", "Chemistry Lab": "Chem Lab", "Statistics": "Stats", "Mechanics": "Mech", "Environment": "Env", "Environment Lab": "Env Lab", "Communication": "Comms", "Programming": "Prog", "Programming Lab": "Prog Lab", "Physics Lab": "Phy Lab", "Design Lab": "Design" };
  var TIMES = ["8:15", "9:10", "10:05", "11:00", "11:30", "12:25", "1:20", "2:15", "3:10"];
  function dayStops(day) {
    var out = "", slot = 0;
    WEEK[day].forEach(function (c) {
      if (c === "L") { out += '<div class="ui-lunch"><span class="ui-node big"></span>Lunch · 11:00–11:30</div>'; slot = 4; return; }
      var len = c && c[3] ? 2 : 1, from = TIMES[slot], to = TIMES[slot + len + (slot < 3 && slot + len > 3 ? 1 : 0)];
      if (!c) out += '<div class="ui-free">Free · ' + from + "–" + to + "</div>";
      else out += stop({ line: c[0], t: from + "–" + to, n: c[1], f: c[2], lab: len === 2 });
      slot += len;
    });
    return out;
  }
  function weekScreen(day) {
    return top() + '<div class="ui-body">' +
      '<div class="ui-seg"><span class="on">Week</span><span>Holidays</span></div>' +
      '<div class="ui-h">The week</div>' +
      '<div class="ui-days">' + Object.keys(WEEK).map(function (d) {
        return '<button type="button" data-day="' + d + '" aria-pressed="' + (d === day) + '">' + d + "</button>";
      }).join("") + "</div>" +
      '<div class="ui-rail ui-rail-plain">' + dayStops(day) + "</div></div>" + nav(1);
  }

  var HOLS = [
    ["October", [["2", "Fri", "Public holiday", "gaz", "Closed · in 17 days", "5 classes off"],
                 ["19", "Mon", "Festival week", "lik", "Usually closed", "5 at risk"],
                 ["20", "Tue", "Festival holiday", "gaz", "Closed", "5 classes off"],
                 ["26", "Mon", "Founders' Day", "gaz", "Closed", "5 classes off"]]],
    ["November", [["8", "Sun", "Autumn break", "gaz", "Closed", "Weekend"],
                  ["9", "Mon", "Autumn break", "lik", "Usually closed", "5 at risk"],
                  ["11", "Wed", "Mid-term break", "lik", "Usually closed", "6 at risk"],
                  ["24", "Tue", "Public holiday", "gaz", "Closed", "5 classes off"]]]
  ];
  function holidayScreen() {
    return top() + '<div class="ui-body">' +
      '<div class="ui-seg"><span>Week</span><span class="on">Holidays</span></div>' +
      '<div class="ui-hrow"><span class="ui-h">Closures</span><span class="ui-link">Calendar view</span></div>' +
      HOLS.map(function (m) {
        return '<div class="ui-month">' + m[0] + '</div><div class="ui-list">' + m[1].map(function (h) {
          return '<div class="ui-hol"><span class="ui-date"><b>' + h[0] + "</b>" + h[1] + "</span>" +
            '<span class="ui-hn"><b>' + esc(h[2]) + '</b><i class="' + h[3] + '">' + h[4] + "</i></span>" +
            '<span class="ui-cost">' + h[5] + "</span></div>";
        }).join("") + "</div>";
      }).join("") + "</div>" + nav(1);
  }

  function planRows() {
    return ["EVSP", "EGL", "PHP", "PPSL", "BEE"].map(function (k) {
      var c = counts(k), used = plan[k] || 0, left = bunks(c.p, c.h, c.r) - used;
      var fin = pct(c.p + c.r - used, c.h + c.r);
      return '<div class="ui-prow2" data-line="' + SUB[k].line + '"><span class="ui-pbar"></span>' +
        '<span class="ui-pm"><b>' + esc(SUB[k].n) + "</b>Been to " + c.p + " of " + c.h + " · " + c.r + " still to come<br>you'd finish at " + fin + "%</span>" +
        '<span class="ui-pn ' + (left < 0 ? "bad" : "") + '"><b>' + Math.max(left, 0) + "</b>Can skip</span>" +
        '<span class="ui-pbtns"><button type="button" data-plan="' + k + '" data-d="-1" aria-label="Unplan a skip in ' + esc(SUB[k].n) + '"' + (used ? "" : " disabled") + '>' + icon("i-minus") + '</button>' +
        '<button type="button" data-plan="' + k + '" data-d="1" aria-label="Plan a skip in ' + esc(SUB[k].n) + '">' + icon("i-plus") + '</button></span></div>';
    }).join("");
  }
  function planBig() {
    var s = summary(), planned = Object.keys(plan).reduce(function (n, k) { return n + plan[k]; }, 0);
    return '<div class="ui-big"><b>' + Math.max(0, s.tb) + '</b><span>classes you can skip in ' + esc(SUB[s.tight].n) +
      ", your tightest subject — " + (s.spread - planned) + " across all subjects if spread as listed</span></div>";
  }
  function planScreen() {
    return top() + '<div class="ui-body">' +
      '<div class="ui-fold"><div class="ui-foldh">Plan a bunk <span class="ui-chev"></span></div>' +
      '<div class="ui-slot" data-slot="big">' + planBig() + "</div>" +
      '<div class="ui-note">You need 75% in every subject, not 75% overall. So a spare class in one subject can\'t cover a missed one in another.</div>' +
      '<div class="ui-h">Per subject</div><div class="ui-plist">' + planRows() + "</div></div></div>" + nav(2);
  }

  /* laptop: the week as a network, and the attendance board */
  function lapChrome(active, inner) {
    return '<div class="lap-bar">' + icon("i-lock") + "bunkr.website</div>" +
      '<div class="lap-app"><div class="lap-side"><svg class="ui-logo" aria-hidden="true"><use href="#logo"/></svg>' +
      [["n-today", "Today"], ["n-week", "Timetable"], ["n-att", "Attendance"], ["n-sec", "Section"]].map(function (n, i) {
        return '<span class="' + (i === active ? "on" : "") + '">' + icon(n[0]) + n[1] + "</span>";
      }).join("") + '</div><div class="lap-main">' + inner + "</div></div>";
  }
  function weekNetwork() {
    var head = '<div class="net-head"><span></span>' + ["8:15", "9:10", "10:05", "", "11:30", "12:25", "1:20", "2:15"].map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div>";
    var rows = Object.keys(WEEK).map(function (d) {
      var cells = "", n = 0;
      WEEK[d].forEach(function (c) {
        if (c === "L") { cells += '<span class="net-l"><i></i></span>'; return; }
        var span = c && c[3] ? 2 : 1;
        if (!c) { cells += '<span class="net-free" style="grid-column:span 1">Free</span>'; return; }
        n++;
        cells += '<span class="net-c" data-line="' + c[0] + '" style="grid-column:span ' + span + '"><i></i><b>' + esc(SHORT[c[1]] || c[1]) + "</b></span>";
      });
      return '<div class="net-row ' + (d === "Tue" ? "is-today" : "") + '"><span class="net-day"><b>' + { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" }[d] + "</b>" + n + " classes</span>" + cells + "</div>";
    }).join("");
    return '<div class="ui-seg lap-seg"><span class="on">Week</span><span>Holidays</span></div><div class="net-grid">' + head + rows + "</div>";
  }
  function board() {
    var keys = ["BEE", "SMT", "EM", "EVS", "CSL", "PPS", "PHP", "PHL"].sort(function (a, b) {
      var A = counts(a), B = counts(b); return A.p / A.h - B.p / B.h;
    });
    return '<div class="ui-h">Subjects</div><div class="lap-board">' + keys.map(function (k) {
      var c = counts(k), b = bunks(c.p, c.h, c.r), v = pct(c.p, c.h);
      var st = b < 0 ? ["bad", VOICE.chip.bad] : b ? ["ok", VOICE.chip.ok] : ["warn", VOICE.chip.warn];
      return '<button type="button" class="ui-srow" data-line="' + SUB[k].line + '" data-pick="' + k + '" aria-label="Load ' + esc(SUB[k].n) + ' into the calculator">' +
        '<span class="bar"></span><span class="m"><b>' + esc(SUB[k].n) + '</b><i class="' + st[0] + '">' + st[1] + "</i>" +
        "<em>" + (b < 0 ? "Attend every class left" : "Miss up to " + b + " of the " + c.r + " left") + "</em>" +
        '<span class="trk"><i style="width:' + Math.min(v, 100) + '%"></i><u></u></span></span>' +
        '<span class="r"><b class="' + (v >= 75 ? "ok" : "bad") + '">' + v + "%</b>" + c.p + " of " + c.h + "</span></button>";
    }).join("") + "</div>";
  }

  /* ---------- mount ---------- */
  var heroPhone = $("#heroPhone"), tourPhone = $("#tourPhone"), planPhone = $("#planPhone");
  var weekDay = "Tue";

  function paint() {
    var s = summary();
    $$('[data-screen="today"]').forEach(function (el) { el.innerHTML = '<div class="ui">' + todayScreen(el.classList.contains("scr")) + "</div>"; });
    var wk = $('[data-screen="week"]'); if (wk) wk.innerHTML = '<div class="ui">' + weekScreen(weekDay) + "</div>";
    var hl = $('[data-screen="holidays"]'); if (hl && !hl.firstChild) hl.innerHTML = '<div class="ui">' + holidayScreen() + "</div>";
    var pl = $('[data-screen="plan"]'); if (pl) pl.innerHTML = '<div class="ui">' + planScreen() + "</div>";
    $("#heroLaptop").innerHTML = lapChrome(1, weekNetwork());
    $("#boardLaptop").innerHTML = lapChrome(2, board());
    liftAll();
    tick();
    measure();
    return s;
  }

  /* The pieces that float off the hero phone are the real plate and stats, moved out
     of the clipped screen into their own layers at exactly the place they left.
     Every slot is measured before anything is written, so nothing forces a second layout. */
  var LIFTS = [["plate", "#heroPhone", ".layer-plate"], ["stats", "#heroPhone", ".layer-stats"], ["big", "#planPhone", ".layer-big"]];
  function liftAll() {
    var jobs = [];
    for (var i = 0; i < LIFTS.length; i++) {
      var phone = $(LIFTS[i][1]), screen = $(".screen", phone), ph = $('[data-slot="' + LIFTS[i][0] + '"]', screen), layer = $(LIFTS[i][2], phone);
      if (ph && layer) jobs.push({ ph: ph, layer: layer, x: screen.offsetLeft + ph.offsetLeft, y: screen.offsetTop + ph.offsetTop, w: ph.offsetWidth });
    }
    for (var k = 0; k < jobs.length; k++) {
      var jb = jobs[k];
      jb.layer.innerHTML = jb.ph.innerHTML;
      jb.ph.style.visibility = "hidden";
      jb.layer.style.cssText = "left:" + jb.x + "px;top:" + jb.y + "px;width:" + jb.w + "px;transform:" + jb.layer.style.transform;
    }
  }

  /* the plate's clock runs from the demo's 10:05 at real speed */
  var t0 = Date.now();
  function tick() {
    var mins = 605 + (Date.now() - t0) / 60000, left = Math.max(0, Math.ceil(660 - mins));
    $$('[data-bind="left"]').forEach(function (b) { b.textContent = left; });
    $$('[data-bind="bar"]').forEach(function (b) { b.style.width = clamp((mins - 550) / 110 * 100, 0, 100) + "%"; });
  }
  setInterval(tick, 15000);

  /* ---------- device interactions ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var strip = b.closest(".ui-marks");
    if (strip) {
      var k = strip.dataset.k, m = b.dataset.m;
      today[k] = today[k] === m ? null : m;
      if (!today[k]) today[k] = "P";                     /* the demo never leaves a past class blank */
      paint(); syncCalc();
      $$('.ui-marks[data-k="' + k + '"] button[data-m="' + today[k] + '"]').forEach(function (n) { n.classList.add("stamp"); });
      return;
    }
    if (b.dataset.day) { weekDay = b.dataset.day; $('[data-screen="week"]').innerHTML = '<div class="ui">' + weekScreen(weekDay) + "</div>"; return; }
    if (b.dataset.plan) {
      var pk = b.dataset.plan; plan[pk] = Math.max(0, (plan[pk] || 0) + (+b.dataset.d));
      var pl = $('[data-screen="plan"]');
      $(".ui-plist", pl).innerHTML = planRows();
      $(".layer-big", planPhone).innerHTML = planBig();
      return;
    }
    if (b.dataset.pick) { pick(b.dataset.pick); }
  });

  /* ============================================================
     Calculator
     ============================================================ */
  var att = $("#c-att"), held = $("#c-held"), left = $("#c-left");
  var fig = $("#c-fig"), text = $("#c-text"), fill = $("#c-fill"), now = $("#c-now"), end = $("#c-end"), endl = $("#c-endlbl");
  var out = $(".verdict"), subName = $("#c-sub"), picked = "BEE";
  var num = function (el) { var v = parseInt(el.value, 10); return isNaN(v) ? 0 : clamp(v, 0, 200); };

  function calc(changed) {
    var p = num(att), h = num(held), r = num(left);
    if (p > h) { if (changed === att) h = p; else p = h; }
    att.value = p; held.value = h; left.value = r;
    var m = bunks(p, h, r), v = pct(p, h);
    fill.style.transform = "scaleX(" + Math.min(v, 100) / 100 + ")";
    fill.style.background = v >= 75 ? "var(--ok)" : "var(--bad)";
    now.textContent = v + "%";
    if (m < 0) {
      out.dataset.state = "under"; fig.textContent = "0";
      text.textContent = VOICE.cooked(pct(p + r, h + r));
      endl.textContent = "At every class"; end.textContent = pct(p + r, h + r) + "%";
    } else {
      out.dataset.state = m === 0 ? "none" : "ok"; fig.textContent = String(m);
      text.textContent = m === 0 ? VOICE.locked : m === r ? VOICE.free : VOICE.spare(m);
      endl.textContent = m ? "If you miss " + m : "At every class"; end.textContent = pct(p + r - m, h + r) + "%";
    }
    if (changed && changed !== "pick") { subName.textContent = "one subject"; picked = null; markPicked(); }
  }
  function markPicked() { $$(".ui-srow").forEach(function (r) { r.classList.toggle("is-picked", r.dataset.pick === picked); }); }
  function pick(k) {
    var c = counts(k); picked = k; subName.textContent = SUB[k].n;
    att.value = c.p; held.value = c.h; left.value = c.r; calc("pick"); markPicked();
    if (!reduce && booted) { fig.classList.remove("flip"); void fig.offsetWidth; fig.classList.add("flip"); }
  }
  function syncCalc() { if (picked) pick(picked); else markPicked(); }

  $$(".stepper button").forEach(function (b) {
    b.addEventListener("click", function () { var el = document.getElementById(b.dataset.for); el.value = num(el) + (+b.dataset.d); calc(el); });
  });
  [att, held, left].forEach(function (el) { el.addEventListener("input", function () { calc(el); }); });

  var booted = false;
  paint();
  pick("BEE");
  booted = true;

  /* the maths must stay the app's */
  var eq = function (a, b, m) { if (a !== b) throw new Error("bunk maths: " + m + " got " + a + ", want " + b); };
  eq(bunks(8, 11, 37), 9, "Chemistry 8 of 11, 37 left");
  eq(bunks(9, 10, 36), 10, "Mechanics 9 of 10, 36 left");
  eq(bunks(2, 2, 12), 3, "Environment Lab 2 of 2, 12 left");
  eq(bunks(3, 10, 2), -1, "cannot recover");
  eq(VOICE.spare(1), "class you can miss and still be chilling.", "one spare reads singular");
  eq(VOICE.spare(2), "classes you can miss and still be chilling.", "two spare reads plural");
  eq(VOICE.cooked(71), "you're cooked. Every class left still only gets you to 71%.", "cooked names the ceiling");
  eq(summary().overall, 92, "demo overall");
  today.PHP = "A"; eq(summary().overall + ":" + summary().tb + SUB[summary().tight].n, "91:2Physics Lab", "absent in the lab"); today.PHP = "P";

  /* ============================================================
     Stages: each device space is authored at a fixed size and scaled to fit
     ============================================================ */
  var narrow = window.matchMedia("(max-width: 760px)");
  var stages = $$(".stage");
  function fit() {
    var widths = stages.map(function (st) { return st.clientWidth; }), vh = window.innerHeight;   /* read all, then write */
    stages.forEach(function (st, i) {
      var nw = narrow.matches && st.dataset.nw, w = +(nw ? st.dataset.nw : st.dataset.w), h = +(nw ? st.dataset.nh : st.dataset.h), s = widths[i] / w;
      if (st.classList.contains("tour-stage")) s = Math.min(s, (vh * 0.8) / h);
      st.style.setProperty("--s", s.toFixed(4));
      st.style.height = (h * s) + "px";
    });
    liftAll();
    measure();
  }
  window.addEventListener("resize", function () { fit(); wake(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); paint(); });
  fit();

  /* ============================================================
     Tour: whichever step crosses the middle owns the phone; tabs on phones
     ============================================================ */
  var steps = $$(".step"), scrs = $$(".scr"), tabs = $$(".tabs button"), active = 0;
  function show(n) {
    active = n;
    steps.forEach(function (s) { s.classList.toggle("is-on", +s.dataset.shot === n); });
    scrs.forEach(function (s, i) { s.classList.toggle("is-on", i === n); s.classList.toggle("was", i < n); s.inert = i !== n; });
    tabs.forEach(function (t) { t.setAttribute("aria-selected", +t.dataset.go === n); });
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { show(+t.dataset.go); }); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !narrow.matches) show(+e.target.dataset.shot); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { io.observe(s); });

  }

  /* ============================================================
     The 3D rig
     ============================================================ */
  var nav_ = $("#nav"), rail = $(".rail"), marker = $("#marker"), travelled = $("#travelled");
  var hero = $("#hero"), tour = $("#tour"), maths = $("#maths"), root = document.documentElement;
  var pointer = { x: 0, y: 0 };

  /* Section geometry in page coordinates, read once per layout change. The frame loop
     then needs only scrollY, so it never asks the browser for layout. */
  var geo = { railTop: 0, railH: 1, heroTop: 0, heroH: 1, tourTop: 0, tourH: 1, mathsTop: 0, mathsH: 1 };
  function measure() {
    if (!geo || !rail) return;                          /* the first paint runs before the rig exists */
    var y = window.scrollY, r = rail.getBoundingClientRect(), h = hero.getBoundingClientRect(), t = tour.getBoundingClientRect(), m = maths.getBoundingClientRect();
    geo.railTop = r.top + y; geo.railH = Math.max(1, r.height);
    geo.heroTop = h.top + y; geo.heroH = h.height;
    geo.tourTop = t.top + y; geo.tourH = t.height;
    geo.mathsTop = m.top + y; geo.mathsH = m.height;
  }

  /* wide: devices share a stage; narrow: each phone has a stage of its own, laptops rest.
     Poses are [x, y, z, rx, ry, rz]. */
  var rigs = [
    { el: heroPhone,         wide: [700, 30, 60, 10, -18, 3],   thin: [15, 18, 40, 8, 14, -2] },
    { el: $("#heroLaptop"),  wide: [0, 110, -40, 8, 16, -1] },
    { el: tourPhone,         wide: [75, 14, 0, 6, 0, 0],        thin: [15, 18, 0, 4, 0, 0] },
    { el: $("#boardLaptop"), wide: [0, 40, -120, 10, 14, 0] },
    { el: planPhone,         wide: [650, -20, 160, 8, -22, 3], thin: [15, 18, 40, 6, -10, 1] }
  ];
  rigs.forEach(function (r) { r.c = new Float64Array(6); r.v = new Float64Array(6); r.t = new Float64Array(6); r.live = false; });
  var base = function (r) { return narrow.matches && r.thin ? r.thin : r.wide; };
  var layers = { hero: $$(".layer", heroPhone), plan: $$(".layer", planPhone) };
  var ex = { hero: 1, plan: 0 };                         /* the hero phone starts apart and assembles */

  var net = $("#net");
  var NET = [
    { line: "pps", d: .5,  x: 58, y: 8,  w: 0,  h: 70, stops: [18, 52] },
    { line: "phy", d: .25, x: 40, y: 30, w: 58, h: 0,  stops: [30, 72] },
    { line: "smt", d: .75, x: 86, y: 4,  w: 0,  h: 88, stops: [40] },
    { line: "bee", d: .38, x: 50, y: 82, w: 46, h: 0,  stops: [20, 64] },
    { line: "em",  d: .9,  x: 72, y: 56, w: 26, h: 0,  stops: [50] }
  ];
  net.innerHTML = NET.map(function (n) {
    return '<span class="net-line" data-line="' + n.line + '" data-d="' + n.d + '" style="left:' + n.x + "%;top:" + n.y + "%;" +
      (n.w ? "width:" + n.w + "%;height:2px" : "height:" + n.h + "%;width:2px") + '">' +
      n.stops.map(function (s) { return '<i style="' + (n.w ? "left" : "top") + ":" + s + '%"></i>'; }).join("") + "</span>";
  }).join("");
  var netEls = $$(".net-line", net), netD = netEls.map(function (l) { return +l.dataset.d; });

  /* A real spring per channel (visual duration .55s, bounce .12): interruptible, and a
     pointer flick carries its velocity instead of restarting an ease. */
  var SK = Math.pow(2 * Math.PI / 0.55, 2), SC = 2 * (1 - 0.12) * Math.sqrt(SK);
  var running = false, still = 0, delta = 0, last = 0;
  function wake() {
    still = 0;
    if (!running && !reduce) { running = true; last = 0; root.classList.add("moving"); requestAnimationFrame(frame); }
  }
  function aim(r, b, x, y, z, rx, ry, rz) {
    var t = r.t; t[0] = b[0] + x; t[1] = b[1] + y; t[2] = b[2] + z; t[3] = b[3] + rx; t[4] = b[4] + ry; t[5] = b[5] + rz;
    if (!r.live) { r.c.set(t); r.live = true; }
  }
  function drive(r, dt) {
    if (!r.el || !r.live) return;
    var c = r.c, v = r.v, t = r.t;
    for (var i = 0; i < 6; i++) {
      v[i] += (SK * (t[i] - c[i]) - SC * v[i]) * dt;
      c[i] += v[i] * dt;
      var m = Math.abs(t[i] - c[i]) + Math.abs(v[i]) * 0.05;
      if (m > delta) delta = m;
    }
    r.el.style.transform = "perspective(2200px) translate3d(" + c[0].toFixed(1) + "px," + c[1].toFixed(1) + "px," + c[2].toFixed(1) +
      "px) rotateX(" + c[3].toFixed(2) + "deg) rotateY(" + c[4].toFixed(2) + "deg) rotateZ(" + c[5].toFixed(2) + "deg)";
  }
  function spread(list, e) { for (var i = 0; i < list.length; i++) list[i].style.transform = "translateZ(" + (2 + e * +list[i].dataset.z).toFixed(1) + "px)"; }

  var start = performance.now();
  function frame(now) {
    var vh = window.innerHeight, y = window.scrollY, time = (now - start) / 1000;
    var dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;

    nav_.classList.toggle("scrolled", y > 8);
    var along = clamp(y + vh * 0.42 - geo.railTop, 0, geo.railH);
    marker.style.transform = "translate3d(0," + along.toFixed(1) + "px,0)";
    travelled.style.transform = "scaleY(" + (along / geo.railH).toFixed(4) + ")";

    if (reduce) {
      for (var q = 0; q < rigs.length; q++) { var bq = base(rigs[q]); rigs[q].live = false; aim(rigs[q], bq, 0, 0, 0, 0, 0, 0); drive(rigs[q], 0); }
      spread(layers.hero, 0.35); spread(layers.plan, 0.4);
      return;
    }
    delta = 0;
    var px = pointer.x, py = pointer.y, blend = 1 - Math.pow(0.93, dt * 60);

    /* hero: pointer tilts the pair, scroll pulls the phone apart and sends the laptop back */
    var heroTop = geo.heroTop - y;
    if (heroTop + geo.heroH > -100) {
      var hp = clamp(-heroTop / (geo.heroH * 0.9), 0, 1);
      aim(rigs[0], base(rigs[0]), px * 30, -hp * 120, hp * 120, -py * 10 + hp * 22, px * 16 - hp * 8, 0);
      aim(rigs[1], base(rigs[1]), px * 14, -hp * 40, -hp * 260, -py * 6 + hp * 10, px * 10 - hp * 14, 0);
      drive(rigs[0], dt); drive(rigs[1], dt);
      var target = time < 1.4 ? 1 : 0.18 + hp * 1.1 + Math.abs(px) * .5, step = (target - ex.hero) * (time < 1.4 ? 0 : blend);
      ex.hero += step; delta = Math.max(delta, Math.abs(step) * 100, time < 1.6 ? 1 : 0);
      spread(layers.hero, ex.hero);
      for (var n = 0; n < netEls.length; n++) {
        netEls[n].style.transform = "translate3d(" + (px * -40 * netD[n]).toFixed(1) + "px," + (y * -0.35 * netD[n] + py * -30 * netD[n]).toFixed(1) + "px,0)";
      }
    }

    /* tour: the phone turns as you read down the steps, and turns to meet the pointer */
    var tourTop = geo.tourTop - y;
    if (tourTop + geo.tourH > 0 && tourTop < vh) {
      var tp = narrow.matches ? 0.5 : clamp((vh * 0.5 - tourTop) / geo.tourH, 0, 1);
      aim(rigs[2], base(rigs[2]), 0, 0, 0, -py * 8, (narrow.matches ? 0 : lerp(-22, 22, tp)) + px * 14, 0);
      drive(rigs[2], dt);
    }

    /* maths: the laptop rises toward you as the section arrives, the plan phone swings in */
    var mathsTop = geo.mathsTop - y;
    if (mathsTop + geo.mathsH > 0 && mathsTop < vh) {
      var mp = clamp((vh - mathsTop) / (geo.mathsH * 0.65), 0, 1), e3 = 1 - Math.pow(1 - mp, 3), off = 1 - e3;
      aim(rigs[3], base(rigs[3]), 0, off * 120, -off * 300, off * 34 - py * 6, px * 10, 0);
      aim(rigs[4], base(rigs[4]), narrow.matches ? 0 : off * 260, 0, 0, -py * 8, -off * 50 + px * 14, 0);
      drive(rigs[3], dt); drive(rigs[4], dt);
      var pstep = (0.25 + Math.abs(px) * 1.2 - ex.plan) * blend;
      ex.plan += pstep; delta = Math.max(delta, Math.abs(pstep) * 100);
      spread(layers.plan, ex.plan);
    }

    still = delta < 0.05 ? still + 1 : 0;
    if (still > 20) { running = false; root.classList.remove("moving"); return; }
    requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", reduce ? function () { requestAnimationFrame(frame); } : wake, { passive: true });
  if (fine && !reduce) window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; wake();
  }, { passive: true });
  measure();
  if (reduce) requestAnimationFrame(frame); else wake();

  /* the two doors lean toward the pointer */
  if (fine && !reduce) $$("[data-tilt]").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
      card.style.transform = "perspective(900px) rotateX(" + (-yy * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg)";
      card.style.setProperty("--gx", ((x + .5) * 100).toFixed(1) + "%"); card.style.setProperty("--gy", ((yy + .5) * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });
})();
