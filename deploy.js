const pkg = require('./package.json');

require('deployer').upload({
  ...pkg.uploadConfig,
  forceUpload: true,
});
