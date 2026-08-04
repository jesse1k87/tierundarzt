// Single source of truth for turning a git ref / branch name into the slug
// used as both the preview URL subfolder and the remote deploy folder.
//
// Keeping this in one place guarantees the build (PATH_PREFIX), the deploy
// (DEPLOY_SUBDIR) and the cleanup all compute the exact same value.
//
// Rules: lowercase, collapse any run of non-alphanumeric characters into a
// single "-", and trim leading/trailing "-".
//   e.g. "claude/FTP-feature_branch" -> "claude-ftp-feature-branch"
//
// As a module:  const { slugifyRef } = require('./slugify-ref');
// As a CLI:     node scripts/slugify-ref.js "<ref>"   (or via REF_NAME env)

function slugifyRef(ref) {
  return String(ref || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { slugifyRef };

// CLI entrypoint: prints the slug on a single line.
if (require.main === module) {
  const ref = process.argv[2] || process.env.REF_NAME || '';
  const slug = slugifyRef(ref);
  if (!slug) {
    console.error('slugify-ref: empty slug computed from ref:', JSON.stringify(ref));
    process.exit(1);
  }
  process.stdout.write(slug + '\n');
}
