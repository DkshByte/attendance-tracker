/* Stamps the build marker, then copies the app to the two places it ships from.
   `npm run prep` runs this instead of a bare cp.

   The version is yours (package.json). The hash is the app's own content with the
   marker blanked out first, so it cannot be circular and cannot be stale: change a
   byte and the stamp changes with it, whether or not anyone remembered to bump
   anything. check.py recomputes it and fails if the two disagree. */
const fs = require("fs"), crypto = require("crypto");
const version = require("./package.json").version;
const MARK = /<!--build:[^>]*-->/;

let html = fs.readFileSync("timetable.html", "utf8");
if (!MARK.test(html)) throw new Error("timetable.html has no <!--build:--> marker to stamp");

const bare = html.replace(MARK, "<!--build:-->");
const hash = crypto.createHash("sha256").update(bare).digest("hex").slice(0, 7);
html = bare.replace(MARK, `<!--build:${version}+${hash}-->`);

for (const f of ["timetable.html", "deploy/app.html", "boot/app.html"]) fs.writeFileSync(f, html);
console.log(`stamped ${version}+${hash}`);
