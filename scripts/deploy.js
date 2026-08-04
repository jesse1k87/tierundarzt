// Deploy entrypoint, run via the "deploy" npm script.
//
// Reads the upload target from package.json's "uploadConfig"
// field: { user, host, localDir, remoteDir }.

const path = require('path');
const pkg = require(path.join(process.cwd(), 'package.json'));
const { deploySite } = require('./sftp-deploy');
require('dotenv').config();

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async (config) => {
  if (!process.env.FTP_PASS) {
    console.error('No password in process.env.FTP_PASS');
    process.exitCode = 1;
    return;
  }

  const baseRemoteDir = config.remoteDir || './www';
  const subdir = process.env.DEPLOY_SUBDIR;
  const remoteDir = subdir ? path.posix.join(baseRemoteDir, subdir) : baseRemoteDir;

  const options = {
    host: config.host,
    username: config.user || config.host,
    password: process.env.FTP_PASS,
    localDir: path.join(process.cwd(), config.localDir || 'docs'),
    remoteDir,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await deploySite(options);
      console.log('Done');
      return;
    } catch (err) {
      console.error(`Deploy attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        process.exitCode = 1;
        return;
      }
      await wait(RETRY_DELAY_MS);
    }
  }
};

run(pkg.uploadConfig || {});
