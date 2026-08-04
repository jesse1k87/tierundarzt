// Appends/updates a site's preview URL in the description of the open pull
// request for the current branch, once that site's preview deploy finishes.
//
// Keeps all preview links in a single marked block so re-runs (new commits,
// multiple sites on the same branch) update in place instead of duplicating.
//
// As a module:  const { buildUpdatedBody } = require('./append-preview-url');
// As a CLI:     node scripts/append-preview-url.js
//               env: GITHUB_TOKEN, GITHUB_REPOSITORY (owner/repo, auto-set in
//                    Actions), BRANCH, SITE, PREVIEW_URL

const START = '<!-- preview-urls:start -->';
const END = '<!-- preview-urls:end -->';

function parseExistingUrls(body) {
  const block = body.match(new RegExp(`${START}([\\s\\S]*?)${END}`));
  const urls = {};
  if (!block) return urls;
  for (const line of block[1].split('\n')) {
    const match = line.match(/^- \*\*(.+?)\*\*: (\S+)$/);
    if (match) urls[match[1]] = match[2];
  }
  return urls;
}

function buildUpdatedBody(body, site, url) {
  const source = body || '';
  const urls = parseExistingUrls(source);
  urls[site] = url;

  const lines = Object.keys(urls)
    .sort()
    .map((name) => `- **${name}**: ${urls[name]}`);
  const block = [START, '**Preview deployments**', ...lines, END].join('\n');

  return new RegExp(`${START}[\\s\\S]*?${END}`).test(source)
    ? source.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
    : `${source.trimEnd()}\n\n${block}\n`.trimStart();
}

async function appendPreviewUrl({ token, repo, branch, site, url }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'append-preview-url-script',
  };
  const [owner] = repo.split('/');

  const listRes = await fetch(
    `https://api.github.com/repos/${repo}/pulls?head=${owner}:${branch}&state=open`,
    { headers }
  );
  if (!listRes.ok) {
    throw new Error(`Failed to list pull requests: ${listRes.status} ${await listRes.text()}`);
  }
  const [pr] = await listRes.json();
  if (!pr) {
    console.log(`No open pull request for branch "${branch}"; skipping.`);
    return;
  }

  const updatedBody = buildUpdatedBody(pr.body, site, url);
  if (updatedBody === (pr.body || '')) {
    console.log(`Preview URL for "${site}" already up to date on PR #${pr.number}.`);
    return;
  }

  const patchRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr.number}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: updatedBody }),
  });
  if (!patchRes.ok) {
    throw new Error(`Failed to update PR #${pr.number}: ${patchRes.status} ${await patchRes.text()}`);
  }
  console.log(`Updated PR #${pr.number} with "${site}" preview URL.`);
}

module.exports = { buildUpdatedBody, appendPreviewUrl };

// CLI entrypoint
if (require.main === module) {
  appendPreviewUrl({
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPOSITORY,
    branch: process.env.BRANCH,
    site: process.env.SITE,
    url: process.env.PREVIEW_URL,
  }).catch((err) => {
    console.error('append-preview-url failed:', err.message);
    process.exitCode = 1;
  });
}
