const fs = require('fs');
const path = require('path');

// Read package.json to get version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Unique build ID = timestamp (changes every deploy)
const buildId = Date.now().toString(36);

// Generate build info
const buildInfo = {
  version: packageJson.version,
  buildId,
  buildDate: new Date().toISOString(),
  buildTime: new Date().toLocaleString('en-US'),
};

// Write to public directory
const buildInfoPath = path.join(__dirname, '../public/build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

// ── Rewrite sw.js with new CACHE_VERSION so browser installs fresh SW ──
const swPath = path.join(__dirname, '../public/sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(
  /const CACHE_VERSION = '[^']+';/,
  `const CACHE_VERSION = '${buildId}';`
);
fs.writeFileSync(swPath, sw);

console.log('✓ Build info generated:', buildInfo);
console.log('✓ Service Worker cache version updated to:', buildId);
