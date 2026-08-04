const process = require('process');
const fs = require('fs');
const chokidar = require('chokidar');
require('dotenv').config();
const { deploy } = require('sftp-sync-deploy');
const pkg = require('./package.json');

const watcher = chokidar.watch(pkg.uploadConfig.localDir, {
  persistent: true,
});

const upload = () => {
  try {
    deploy(
      {
        host: pkg.uploadConfig.host,
        port: 22,
        username: pkg.uploadConfig.host,
        password: process.env.FTP_PASS,
        localDir: pkg.uploadConfig.localDir,
        remoteDir: pkg.uploadConfig.remoteDir,
      },
      {
        dryRun: false,
        exclude: ['node_modules', 'package.json'],
        excludeMode: 'ignore',
        forceUpload: true,
      }
    )
      .then(() => {
        console.log('Done');
      })
      .catch((err) => {
        console.error('Error ', err);
      });
  } catch (e) {
    throw Error(e);
  }
};

upload();

watcher.on('change', () => upload());
