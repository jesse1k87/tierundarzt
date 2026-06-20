const pkg = require('./package.json');
const { deploy } = require('sftp-sync-deploy');
require('dotenv').config();

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const upload = async (config) => {
  if (!process.env.FTP_PASS) {
    throw Error('No password in process.env.FTP_PASS');
  }

  const options = {
    host: config.host,
    port: 22,
    username: config.user || config.host, // Username is same as host
    password: process.env.FTP_PASS,
    localDir: config.localDir || '',
    remoteDir: config.remoteDir || './www',
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await deploy(options, {
        dryRun: false,
        exclude: ['node_modules', 'package.json', '.turbo'],
        excludeMode: 'remove',
        forceUpload: config.forceUpload ? Boolean(config.forceUpload) : true,
      });
      console.log('Done');
      return;
    } catch (err) {
      console.error(`Deploy attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err);
      if (attempt === MAX_ATTEMPTS) {
        process.exitCode = 1;
        return;
      }
      await wait(RETRY_DELAY_MS);
    }
  }
};

upload(pkg.uploadConfig);
