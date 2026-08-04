const fs = require('fs');
const path = require('path');
const SftpClient = require('ssh2-sftp-client');

const DEFAULT_EXCLUDE = new Set(['node_modules', 'package.json', '.turbo', '.DS_Store']);
const FILE_RETRY_ATTEMPTS = 3;
const FILE_RETRY_DELAY_MS = 1000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns file paths as arrays of segments, relative to localDir.
function collectFiles(localDir, exclude) {
  const files = [];
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (exclude.has(entry.name)) continue;
      const nextSegments = [...segments, entry.name];
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, nextSegments);
      } else if (entry.isFile()) {
        files.push(nextSegments);
      }
    }
  };
  walk(localDir, []);
  return files;
}

async function uploadFileWithRetry(client, localPath, remotePath) {
  let lastErr;
  for (let attempt = 1; attempt <= FILE_RETRY_ATTEMPTS; attempt++) {
    try {
      await client.put(localPath, remotePath);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < FILE_RETRY_ATTEMPTS) {
        await wait(FILE_RETRY_DELAY_MS * attempt);
      }
    }
  }
  throw lastErr;
}

// Uploads every file individually (with per-file retry) instead of relying on
// a single bulk transfer, and reports exactly which files failed, since the
// previous sftp-sync-deploy based flow could silently leave files unsent.
async function deploySite({ host, username, password, localDir, remoteDir, exclude }) {
  if (!password) {
    throw new Error('No password in process.env.FTP_PASS');
  }

  const excludeSet = new Set([...DEFAULT_EXCLUDE, ...(exclude || [])]);
  const files = collectFiles(localDir, excludeSet);
  if (files.length === 0) {
    throw new Error(`No files found in ${localDir}, aborting deploy`);
  }

  const client = new SftpClient();
  const remoteDirCache = new Set();
  const failed = [];

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

    await client.mkdir(remoteDir, true);
    remoteDirCache.add(remoteDir);

    for (const segments of files) {
      const localPath = path.join(localDir, ...segments);
      const remotePath = path.posix.join(remoteDir, ...segments);
      const remoteFileDir = path.posix.dirname(remotePath);

      if (!remoteDirCache.has(remoteFileDir)) {
        await client.mkdir(remoteFileDir, true);
        remoteDirCache.add(remoteFileDir);
      }

      try {
        await uploadFileWithRetry(client, localPath, remotePath);
      } catch (err) {
        failed.push({ file: segments.join('/'), error: err.message });
      }
    }
  } finally {
    await client.end().catch(() => {});
  }

  const succeeded = files.length - failed.length;
  console.log(`Uploaded ${succeeded}/${files.length} files to ${host}:${remoteDir}`);

  if (failed.length > 0) {
    for (const { file, error } of failed) {
      console.error(`Failed: ${file} - ${error}`);
    }
    throw new Error(`${failed.length} file(s) failed to upload`);
  }
}

module.exports = { deploySite };
