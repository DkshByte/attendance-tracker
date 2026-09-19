/* The invite card WhatsApp shows, drawn at 1200x630.

   The site's Blinker woff2 is converted into api/fonts/ because Satori cannot read
   woff2 at all.

   The module wiring here is load-bearing and was arrived at the hard way:

     - The handler is CommonJS (req, res). An ESM handler could return ImageResponse's
       Response directly, but then @vercel/og will not load at all (see below), and a
       Response returned from a CJS handler is ignored and the request hangs.
     - @vercel/og is ESM, so it is reached by dynamic import(). require() works on a
       local Node 24, which supports require(esm), and fails on Vercel's runtime with
       ERR_REQUIRE_ESM — so local success means nothing here. Only a deploy proves it.
     - The version is pinned exactly. 1.x bundles a harfbuzz shim that throws
       "Dynamic require of fs" the moment it is imported on this runtime.

   Satori takes plain objects rather than JSX because deploy/ has no build step and
   should not grow one. Only flexbox works, and only ttf/otf/woff fonts. */
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { cleanName } = require("./_name.js");

const BG = "#000000", INK = "#FFFFFF", MUTED = "#A0A4B0";
const RED = "#FF4D40", GREEN = "#35D07F", RAIL = "#26272F";

let ImageResponse;
async function loadOg() {
  if (!ImageResponse) ImageResponse = (await import("@vercel/og")).ImageResponse;
  return ImageResponse;
}

/* Blinker, the site's own face. Read once per cold start, not per request. */
let fonts;
async function loadFonts() {
  if (!fonts) {
    const at = (n) => path.join(__dirname, "fonts", n);
    fonts = [
      { name: "Blinker", weight: 900, style: "normal", data: await readFile(at("Blinker-900.ttf")) },
      { name: "Blinker", weight: 400, style: "normal", data: await readFile(at("Blinker-400.ttf")) }
    ];
  }
  return fonts;
}

const el = (type, style, children) => ({ type, props: { style, children } });
const row = (style, children) => el("div", { display: "flex", ...style }, children);

function card(name) {
  return row({ width: "100%", height: "100%", background: BG, flexDirection: "column",
               justifyContent: "space-between", padding: "72px 80px", fontFamily: "Blinker" }, [
    row({ alignItems: "center", gap: "18px" }, [
      el("div", { width: "26px", height: "26px", borderRadius: "7px", background: RED }),
      el("div", { fontSize: 38, fontWeight: 900, color: INK, letterSpacing: "-0.02em" }, "bunkr")
    ]),
    row({ flexDirection: "column" }, [
      el("div", { fontSize: 92, fontWeight: 900, color: INK, letterSpacing: "-0.02em", lineHeight: 1.05 },
        name ? "Hi " + name + "." : "What's next?"),
      el("div", { fontSize: 92, fontWeight: 900, color: RED, letterSpacing: "-0.02em", lineHeight: 1.05 },
        name ? "Your seat's open." : "Can I skip it?"),
      el("div", { fontSize: 30, fontWeight: 400, color: MUTED, marginTop: "26px", lineHeight: 1.3 },
        "Your timetable, and exactly how many classes you can still miss.")
    ]),
    row({ flexDirection: "column" }, [
      row({ width: "100%", height: "12px", borderRadius: "6px", background: RAIL }, [
        el("div", { width: "75%", height: "12px", borderRadius: "6px", background: GREEN })
      ]),
      row({ justifyContent: "space-between", marginTop: "16px", fontSize: 24, fontWeight: 400, color: MUTED }, [
        el("div", {}, "bunkr.website"),
        el("div", { color: GREEN, fontWeight: 900 }, "75%")
      ])
    ])
  ]);
}

module.exports = async function handler(req, res) {
  const name = cleanName(new URL(req.url, "https://www.bunkr.website").searchParams.get("n"));
  const OG = await loadOg();
  const img = new OG(card(name), { width: 1200, height: 630, fonts: await loadFonts() });
  const buf = Buffer.from(await img.arrayBuffer());
  res.setHeader("Content-Type", "image/png");
  /* the name is in the URL, so every distinct card caches for good */
  res.setHeader("Cache-Control", "public, immutable, no-transform, max-age=31536000");
  res.end(buf);
};
module.exports.card = card;
