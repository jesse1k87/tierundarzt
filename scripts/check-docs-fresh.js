/*
 * Fails if the committed docs/ directory does not match what `npm run build`
 * produces from src/.
 *
 * docs/ is the GitHub Pages publishing directory, so whatever is committed
 * there is exactly what visitors get. Nothing regenerates it on the server:
 * if someone edits src/ and forgets to rebuild, the site silently keeps
 * serving the previous HTML. This check makes that drift a build failure.
 *
 * Run `npm run build` first, then this script.
 *
 * The commit-sha meta tag is ignored. It records the commit the build ran
 * from, which is necessarily the parent of the commit that carries the
 * output, so it can never match on the same revision.
 */

const { execSync } = require('child_process');

const SHA_META = /<meta content="[0-9a-f]{40}" name="commit-sha">/g;
const PLACEHOLDER = '<meta content="COMMIT_SHA" name="commit-sha">';

const normalize = (buf) => buf.toString('utf8').replace(SHA_META, PLACEHOLDER);

const run = (cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Files in docs/ that differ from HEAD, plus anything untracked.
const changed = run('git status --porcelain -- docs')
  .split('\n')
  .filter(Boolean)
  .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3).trim() }));

const real = [];

for (const { status, path } of changed) {
  // A new or deleted file is always a real difference.
  if (status !== 'M' || !path.endsWith('.html')) {
    real.push({ path, reason: status === '??' ? 'not committed' : `status ${status}` });
    continue;
  }

  let committed;
  try {
    committed = execSync(`git show HEAD:${path}`, { maxBuffer: 64 * 1024 * 1024 });
  } catch {
    real.push({ path, reason: 'not in HEAD' });
    continue;
  }

  const built = require('fs').readFileSync(path);
  if (normalize(committed) !== normalize(built)) {
    real.push({ path, reason: 'content differs' });
  }
}

if (real.length === 0) {
  console.log('docs/ is up to date with src/.');
  process.exit(0);
}

console.error('docs/ is out of date with src/.\n');
console.error('The following files would change if the site were rebuilt:\n');
for (const { path, reason } of real) {
  console.error(`  ${path}  (${reason})`);
}
console.error('\ndocs/ is the GitHub Pages publishing directory, so this means the');
console.error('live site does not match src/. Run:\n');
console.error('  npm run build\n');
console.error('and commit the resulting docs/ changes.');
process.exit(1);
