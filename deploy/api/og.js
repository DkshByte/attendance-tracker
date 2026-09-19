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

/* the site's own tokens, straight out of landing-styles.css */
const BG = "#000000", PLATE = "#0D0D11", RULE = "rgba(255,255,255,.10)", RAIL = "#26272F";
const INK = "#FFFFFF", INK2 = "#A0A4B0", INK3 = "#8A8F9E", BADGE_INK = "#08101F";
const RED = "#FF4D40", AMBER = "#FFB92E", BLUE = "#4E96FF", GREEN = "#35D07F";
const LINES = [RED, AMBER, BLUE, GREEN, "#B18CFF", "#FF6BB0", "#29D6CD", "#FF9147"];

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
      { name: "Blinker", weight: 700, style: "normal", data: await readFile(at("Blinker-700.ttf")) },
      { name: "Blinker", weight: 400, style: "normal", data: await readFile(at("Blinker-400.ttf")) }
    ];
  }
  return fonts;
}

/* The wordmark itself, not an approximation of it. Satori takes an <img>, so the real
   SVG goes in as a data URI with the ink baked in — currentColor resolves to nothing. */
let logo;
function logoSrc() {
  if (!logo) {
    const svg = require("node:fs").readFileSync(path.join(__dirname, "logo.svg.txt"), "utf8");
    logo = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  }
  return logo;
}

const el = (type, style, children, src) => ({ type, props: src ? { style, src } : { style, children } });
const row = (style, children) => el("div", { display: "flex", ...style }, children);
const abs = (style) => el("div", { position: "absolute", ...style });

/* The headline sits in a 620px column beside the plan card, and a long name will walk
   straight under it. Blinker 900 at 76px runs about 30px a character, so the type
   shrinks to keep the longest line inside the column. */
function headSize(lines) {
  const longest = Math.max.apply(null, lines.map((l) => l.length));
  return Math.max(46, Math.min(76, Math.round(76 * 18 / longest)));
}

function card(name) {
  const head = name ? ["Hi " + name + ".", "Your seat's open."] : ["What's next?", "Can I skip it?"];
  const hs = headSize(head);

  return row({ position: "relative", width: "100%", height: "100%", background: BG,
               fontFamily: "Blinker", overflow: "hidden" }, [
    /* the rails that run behind everything on the site */
    abs({ left: "764px", top: "0px", width: "1px", height: "630px", background: RED, opacity: 0.55 }),
    abs({ left: "1114px", top: "0px", width: "1px", height: "630px", background: GREEN, opacity: 0.55 }),
    abs({ left: "560px", top: "95px", width: "640px", height: "1px", background: RULE }),
    abs({ left: "700px", top: "556px", width: "500px", height: "1px", background: RULE }),

    /* left column */
    row({ position: "absolute", left: "80px", top: "70px", width: "620px",
          flexDirection: "column", height: "490px", justifyContent: "space-between" }, [
      row({ flexDirection: "column" }, [
        el("img", { width: "187px", height: "44px" }, undefined, logoSrc()),
        el("div", { marginTop: "56px", fontSize: hs, fontWeight: 900, color: INK,
                    letterSpacing: "-0.025em", lineHeight: 1.06 }, head[0]),
        el("div", { fontSize: hs, fontWeight: 900, color: INK,
                    letterSpacing: "-0.025em", lineHeight: 1.06 }, head[1]),
        el("div", { marginTop: "34px", fontSize: 27, fontWeight: 400, color: INK2,
                    lineHeight: 1.35, width: "530px" },
          "Your timetable and the 75% attendance maths, for every subject.")
      ]),
      el("div", { fontSize: 19, fontWeight: 700, color: INK3, letterSpacing: "0.14em" },
        "BUNKR.WEBSITE \u00b7 WEB & ANDROID")
    ]),

    /* the plan card on the right */
    row({ position: "absolute", left: "750px", top: "128px", width: "378px", padding: "34px 36px",
          flexDirection: "column", background: PLATE, borderRadius: "20px",
          border: "1px solid " + RULE }, [
      row({ alignSelf: "flex-start", background: BLUE, color: BADGE_INK, borderRadius: "4px",
            padding: "5px 12px", fontSize: 16, fontWeight: 900, letterSpacing: "0.1em" },
        "PLAN A BUNK"),
      el("div", { marginTop: "18px", fontSize: 108, fontWeight: 900, color: AMBER,
                  letterSpacing: "-0.04em", lineHeight: 0.9 }, "10"),
      el("div", { marginTop: "16px", fontSize: 25, fontWeight: 700, color: INK, lineHeight: 1.3 },
        "classes you can still skip in Mechanics and finish on 75%"),
      row({ marginTop: "26px", position: "relative", width: "100%", height: "10px",
            borderRadius: "5px", background: RAIL }, [
        el("div", { width: "72%", height: "10px", borderRadius: "5px", background: GREEN }),
        abs({ left: "74%", top: "-3px", width: "3px", height: "16px", borderRadius: "2px", background: INK })
      ]),
      row({ marginTop: "14px", justifyContent: "space-between", fontSize: 15, fontWeight: 700,
            color: INK3, letterSpacing: "0.1em" }, [
        row({}, [el("div", {}, "NOW "), el("div", { color: INK, marginLeft: "5px" }, "90%")]),
        row({}, [el("div", {}, "LINE "), el("div", { color: INK, marginLeft: "5px" }, "75%")])
      ])
    ]),

    /* the line colours along the bottom edge */
    row({ position: "absolute", left: "0px", top: "620px", width: "1200px", height: "10px" },
      LINES.map((c) => el("div", { width: "150px", height: "10px", background: c })))
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
module.exports.headSize = headSize;
