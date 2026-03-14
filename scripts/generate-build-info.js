const fs = require('fs');
const path = require('path');

// Read package.json to get version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Generate build info
const buildInfo = {
  version: packageJson.version,
  buildDate: new Date().toISOString(),
  buildTime: new Date().toLocaleString('en-US'),
};

// Write to public directory
const buildInfoPath = path.join(__dirname, '../public/build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log('✓ Build info generated:', buildInfo);
