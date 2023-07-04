const pkg = require('./package.json');
const { deploy } = require('sftp-sync-deploy');
require('dotenv').config();

const upload = (config) => {
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
  deploy(options, {
    dryRun: false,
    exclude: ['node_modules', 'package.json', '.turbo'],
    excludeMode: 'remove',
    forceUpload: config.forceUpload ? Boolean(config.forceUpload) : true,
  })
    .then(() => {
      console.log('Done');
    })
    .catch((err) => {
      console.error('Error ', err);
    });
};

upload(pkg.uploadConfig);
