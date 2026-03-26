/**
 * Updates the VPS_SSH_PRIVATE_KEY GitHub secret via API.
 * Uses tweetsodium for libsodium encryption (required by GitHub API).
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'SIDRATV/sidraprojecttvchannel';
const SECRET_NAME = 'VPS_SSH_PRIVATE_KEY';

if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN env var');
  process.exit(1);
}

// Read private key from file
const privateKeyPath = process.env.PRIVATE_KEY_PATH;
if (!privateKeyPath || !fs.existsSync(privateKeyPath)) {
  console.error('Missing or invalid PRIVATE_KEY_PATH');
  process.exit(1);
}
const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8').trim();

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'sidra-deploy-script',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const sodium = require('tweetsodium');

  // Step 1: Get repo public key
  console.log('→ Getting repo public key...');
  const { data: keyInfo } = await apiRequest('GET', `/repos/${REPO}/actions/secrets/public-key`);
  if (!keyInfo.key || !keyInfo.key_id) {
    console.error('Failed to get repo public key:', keyInfo);
    process.exit(1);
  }

  // Step 2: Encrypt value with libsodium sealed box
  const messageBytes = Buffer.from(privateKeyContent);
  const keyBytes = Buffer.from(keyInfo.key, 'base64');
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

  // Step 3: Update secret
  console.log(`→ Updating GitHub secret ${SECRET_NAME}...`);
  const result = await apiRequest('PUT', `/repos/${REPO}/actions/secrets/${SECRET_NAME}`, {
    encrypted_value: encryptedValue,
    key_id: keyInfo.key_id,
  });

  if (result.status === 201 || result.status === 204) {
    console.log(`✓ Secret ${SECRET_NAME} updated successfully (HTTP ${result.status})`);
  } else {
    console.error(`✗ Failed to update secret (HTTP ${result.status}):`, result.data);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
