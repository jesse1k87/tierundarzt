// Removes a feature-branch preview folder from the remote host over SFTP.
//
// Used by the preview-cleanup workflow when a pull request is closed/merged.
// Reuses the same ssh2-sftp-client connection settings as scripts/sftp-deploy.js.
//
// Safety: refuses to delete unless the target is a real subfolder of the base
// docroot, so a missing/empty slug can never wipe the production site (./www).
//
// As a module:   const { removeRemoteDir } = require('./sftp-cleanup');
// As a CLI:      node scripts/sftp-cleanup.js
//                env: CLEANUP_HOST, CLEANUP_USER, FTP_PASS, DEPLOY_SUBDIR,
//                     CLEANUP_BASE (optional, default "./www")

const path = require('path');
const SftpClient = require('ssh2-sftp-client');
require('dotenv').config();

async function removeRemoteDir({ host, username, password, baseDir, subdir }) {
  if (!password) {
    throw new Error('No password in process.env.FTP_PASS');
  }

  const base = baseDir || './www';
  const slug = (subdir || '').trim();
  if (!slug) {
    throw new Error('Refusing to clean up: empty DEPLOY_SUBDIR/slug');
  }

  const remoteDir = path.posix.join(base, slug);
  // Defense in depth: never operate on the base docroot itself.
  if (path.posix.normalize(remoteDir) === path.posix.normalize(base)) {
    throw new Error(`Refusing to clean up: resolved path equals base docroot (${base})`);
  }

  const client = new SftpClient();
  try {
    await client.connect({
      host,
      port: 22,
      username,
      password,
      readyTimeout: 20000,
      retries: 2,
      retry_factor: 2,
      retry_minTimeout: 2000,
    });

    if (await client.exists(remoteDir)) {
      await client.rmdir(remoteDir, true); // recursive
      console.log(`Removed ${host}:${remoteDir}`);
    } else {
      console.log(`Nothing to remove: ${host}:${remoteDir} does not exist`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = { removeRemoteDir };

// CLI entrypoint
if (require.main === module) {
  removeRemoteDir({
    host: process.env.CLEANUP_HOST,
    username: process.env.CLEANUP_USER || process.env.CLEANUP_HOST,
    password: process.env.FTP_PASS,
    baseDir: process.env.CLEANUP_BASE || './www',
    subdir: process.env.DEPLOY_SUBDIR,
  })
    .then(() => console.log('Done'))
    .catch((err) => {
      console.error('Cleanup failed:', err.message);
      process.exitCode = 1;
    });
}
