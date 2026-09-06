/* ============================================================
   Bunkr Landing Page — landing-main.js
   Count-up stats + mobile menu logic
   ============================================================ */

(function () {
  "use strict";

  /* ── Count-up animation ──────────────────────────────────── */
  var stats = [
    { el: document.getElementById("sv0"), target: 1,   suffix: "s",  decimals: 0, dur: 900,  delay: 480 },
    { el: document.getElementById("sv1"), target: 75,  suffix: "%",  decimals: 0, dur: 1200, delay: 570 },
    { el: document.getElementById("sv2"), target: 24,  suffix: "/7", decimals: 0, dur: 1400, delay: 660 },
    { el: document.getElementById("sv3"), target: 100, suffix: "%",  decimals: 0, dur: 1500, delay: 750 }
  ];

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(item) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var elapsed  = ts - start;
      var progress = Math.min(elapsed / item.dur, 1);
      var eased    = easeOutCubic(progress);
      var value    = eased * item.target;
      item.el.textContent = value.toFixed(item.decimals) + item.suffix;
      if (progress < 1) requestAnimationFrame(step);
      else item.el.textContent = item.target.toFixed(item.decimals) + item.suffix;
    }
    setTimeout(function () { requestAnimationFrame(step); }, item.delay);
  }

  /* IntersectionObserver — fire once */
  var statsSection = document.querySelector(".stats");
  var observed = false;

  if (statsSection && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (observed) return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observed = true;
          stats.forEach(function (s) { if (s.el) countUp(s); });
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(statsSection);
  } else {
    stats.forEach(function (s) { if (s.el) countUp(s); });
  }

  /* ── Mobile Menu ─────────────────────────────────────────── */
  var burger  = document.getElementById("burger");
  var overlay = document.getElementById("mobile-overlay");
  var body    = document.body;

  function openMenu() {
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    overlay.classList.add("open");
    overlay.removeAttribute("hidden");
    body.classList.add("menu-open");
  }

  function closeMenu() {
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    overlay.classList.remove("open");
    overlay.setAttribute("hidden", "");
    body.classList.remove("menu-open");
  }

  if (burger && overlay) {
    burger.addEventListener("click", function () {
      burger.classList.contains("open") ? closeMenu() : openMenu();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

})();
