/* /i/<first-name> — the page an invite link points at.

   WhatsApp reads Open Graph tags server-side with no JavaScript, so a static file
   cannot vary per recipient: that is the whole reason this route exists. Crawlers
   read the meta and stop; a person gets bounced on to the site a moment later. A
   redirect status would be wrong here — the crawler would follow it to index.html
   and read the generic card again.

   CommonJS and (req, res) on purpose: ESM cannot load @vercel/og (see og.js), and a
   web-standard Response returned from a CJS function is ignored and hangs. */
const { cleanName } = require("./_name.js");

const SITE = "https://www.bunkr.website";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page(name) {
  const title = name ? name + " — your seat on Bunkr is unclaimed"
                     : "Bunkr · What's next, and can you skip it";
  const desc = name
    ? "Your section's timetable, and the 75% attendance maths for every subject: what's next, and exactly how many classes you can still miss."
    : "Your timetable and the 75% attendance maths for every subject.";
  const img = SITE + "/api/og" + (name ? "?n=" + encodeURIComponent(name) : "");
  const alt = name ? "Hi " + name + ". Your seat's open." : "Bunkr";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bunkr">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${SITE}/">
<meta http-equiv="refresh" content="0;url=${SITE}/">
<style>html,body{background:#000;margin:0}</style>
</head>
<body><script>location.replace(${JSON.stringify(SITE + "/")})</script></body>
</html>`;
}

module.exports = function handler(req, res) {
  const name = cleanName(new URL(req.url, SITE).searchParams.get("n"));
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  /* one name per link and never a listing, but keep them out of search anyway */
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(page(name));
};
module.exports.page = page;
