// Post-build gap-filler for preview deployments.
//
// EleventyHtmlBasePlugin already rewrites root-relative href/src/srcset in the
// output HTML to include PATH_PREFIX, but it does NOT touch:
//   - url(...) inside inline style="" attributes (tierundarzt background-images)
//   - external .css files (tierundarzt's compiled style.css has one absolute url)
//
// This script rewrites only ABSOLUTE url(/...) references to include the prefix.
// Relative url(./...) / url(../...) (e.g. tierundarzt's font files) and
// protocol-relative url(//cdn...) are left untouched, since the browser already
// resolves those correctly relative to the stylesheet or page URL.
//
// It is a no-op unless PATH_PREFIX is set to a real subfolder prefix, so it is
// safe to run unconditionally; production builds (PATH_PREFIX unset or "/") are
// left byte-identical.
//
// Usage: node scripts/rewrite-prefix.js <siteDir>   (defaults to "_site")

const fs = require('fs');
const path = require('path');

const rawPrefix = process.env.PATH_PREFIX || '/';
if (rawPrefix === '/' || rawPrefix === '') {
  process.exit(0); // production / no prefix: nothing to do
}

// Normalize "/slug/", "slug", "/slug" -> "/slug"
const prefix = '/' + rawPrefix.replace(/^\/+|\/+$/g, '');

const siteDir = path.resolve(process.argv[2] || '_site');

// Match url( + optional quote + a single leading slash that is NOT followed by
// another slash (so protocol-relative //host is skipped). Relative ./ and ../
// never start with a slash, so they are skipped too.
const absoluteUrl = /url\(\s*(['"]?)\/(?!\/)/g;

const rewrite = (content) => content.replace(absoluteUrl, (_m, quote) => `url(${quote}${prefix}/`);

let changedFiles = 0;

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs);
    } else if (entry.isFile() && /\.(css|html)$/.test(entry.name)) {
      const before = fs.readFileSync(abs, 'utf8');
      const after = rewrite(before);
      if (after !== before) {
        fs.writeFileSync(abs, after);
        changedFiles++;
      }
    }
  }
};

if (!fs.existsSync(siteDir)) {
  console.error(`rewrite-prefix: directory not found: ${siteDir}`);
  process.exit(1);
}

walk(siteDir);
console.log(`rewrite-prefix: rewrote absolute url(/...) -> url(${prefix}/...) in ${changedFiles} file(s) under ${siteDir}`);
