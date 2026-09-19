/* The one thing a stranger controls. Shared so the invite page can validate a name
   without dragging Satori and Resvg in with it. Leading underscore keeps Vercel from
   turning it into a route. */

/* A first name only, and only a plausible one: anything else falls back to the
   generic card rather than letting a URL paint arbitrary text onto the brand. */
function cleanName(raw) {
  const n = String(raw == null ? "" : raw).trim().split(/\s+/)[0] || "";
  if (!/^[\p{L}][\p{L}'’-]{0,23}$/u.test(n)) return null;
  return n.charAt(0).toUpperCase() + n.slice(1);
}

module.exports = { cleanName };

/* node deploy/api/_name.js — check.py runs this. A name arrives from a URL and ends up
   painted into an image and into meta tags, so it is the one input worth pinning down. */
if (require.main === module) {
  const assert = require("node:assert");
  const eq = (a, b) => assert.strictEqual(cleanName(a), b);
  eq("aryan", "Aryan");                      /* plain */
  eq("  priya   sharma ", "Priya");          /* first name only, trimmed */
  eq("josé", "José");                        /* accents survive: latin-ext is in the font */
  eq("O'Brien", "O'Brien");                  /* apostrophes and hyphens are real in names */
  eq("anne-marie", "Anne-marie");
  eq("<script>alert(1)</script>", null);     /* nothing else gets painted onto the brand */
  eq("a".repeat(40), null);                  /* no overflowing the card */
  eq("12345", null);
  eq("", null);
  eq(null, null);
  eq(undefined, null);
  /* a long name must shrink to stay out of the plan card, a short one must not shrink */
  const { headSize } = require("./og.js");
  assert.strictEqual(headSize(["Hi Aryan.", "Your seat's open."]), 76);
  assert.ok(headSize(["Hi " + "a".repeat(24) + ".", "Your seat's open."]) < 62);
  assert.ok(headSize(["Hi " + "a".repeat(99) + "."]) >= 46);
  console.log("PASS  cleanName handles every case, and the headline fits");
}
