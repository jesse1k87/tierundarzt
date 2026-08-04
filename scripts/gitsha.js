const { execSync } = require('child_process');

module.exports = () => {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return process.env.GITHUB_SHA || 'unknown';
  }
};
