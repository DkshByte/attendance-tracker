/* ============================================================
   Bunkr Landing Page — landing-main.js
   ============================================================ */
(function () {
  "use strict";

  /* ── Count-up stats ──────────────────────────────────────── */
  var stats = [
    { el: document.getElementById("sv0"), target: 1,   suffix: "s",  dec: 0, dur: 900,  delay: 540 },
    { el: document.getElementById("sv1"), target: 75,  suffix: "%",  dec: 0, dur: 1100, delay: 610 },
    { el: document.getElementById("sv2"), target: 24,  suffix: "/7", dec: 0, dur: 1300, delay: 680 },
    { el: document.getElementById("sv3"), target: 100, suffix: "%",  dec: 0, dur: 1400, delay: 750 }
  ];

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function countUp(s) {
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / s.dur, 1);
      s.el.textContent = (easeOut(p) * s.target).toFixed(s.dec) + s.suffix;
      if (p < 1) requestAnimationFrame(frame);
      else s.el.textContent = s.target.toFixed(s.dec) + s.suffix;
    }
    setTimeout(function () { requestAnimationFrame(frame); }, s.delay);
  }

  var bar = document.querySelector(".stats-bar");
  var fired = false;
  if (bar && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries, obs) {
      if (fired) return;
      if (entries[0].isIntersecting) {
        fired = true;
        stats.forEach(function (s) { if (s.el) countUp(s); });
        obs.disconnect();
      }
    }, { threshold: 0.2 }).observe(bar);
  } else {
    stats.forEach(function (s) { if (s.el) countUp(s); });
  }

  /* ── Mobile menu ─────────────────────────────────────────── */
  var burger  = document.getElementById("burger");
  var overlay = document.getElementById("mobile-overlay");

  function open() {
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    overlay.classList.add("open");
    overlay.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }
  function close() {
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    overlay.classList.remove("open");
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  if (burger && overlay) {
    burger.addEventListener("click", function () {
      burger.classList.contains("open") ? close() : open();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 680) close();
    });
  }
})();
