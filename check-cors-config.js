#!/usr/bin/env node

/**
 * Diagnostic script to check Cloudflare R2 CORS configuration
 * Run: node check-cors-config.js
 */

const https = require('https');
const http = require('http');

// Configuration
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'YOUR_ACCOUNT_ID';
const ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY';
const SECRET_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY';
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sidratvstoragevideopremium';

console.log('🔍 Cloudflare R2 CORS Diagnostic Tool\n');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Checking Environment Variables...\n');
if (!ACCOUNT_ID || ACCOUNT_ID === 'YOUR_ACCOUNT_ID') {
  console.error('❌ CLOUDFLARE_ACCOUNT_ID not set or invalid');
  process.exit(1);
}
if (!ACCESS_KEY || ACCESS_KEY === 'YOUR_ACCESS_KEY') {
  console.error('❌ CLOUDFLARE_ACCESS_KEY_ID not set or invalid');
  process.exit(1);
}
if (!SECRET_KEY || SECRET_KEY === 'YOUR_SECRET_KEY') {
  console.error('❌ CLOUDFLARE_SECRET_ACCESS_KEY not set or invalid');
  process.exit(1);
}

console.log(`✅ ACCOUNT_ID: ${ACCOUNT_ID.substring(0, 10)}...`);
console.log(`✅ ACCESS_KEY: ${ACCESS_KEY.substring(0, 5)}...`);
console.log(`✅ SECRET_KEY: ${SECRET_KEY.substring(0, 5)}...`);
console.log(`✅ BUCKET: ${BUCKET}\n`);

// Instructions for manual CORS verification
console.log('📝 Manual Verification Steps:\n');
console.log('1. Go to: https://dash.cloudflare.com/');
console.log('2. Select your account');
console.log('3. Navigate to: R2 → Buckets');
console.log('4. Click on: ' + BUCKET);
console.log('5. Go to: Settings → CORS Configuration');
console.log('6. Verify the following rule exists:\n');

console.log('```json');
console.log('[');
console.log('  {');
console.log('    "AllowedOrigins": [');
console.log('      "https://sidraprojecttvchannel-pi.vercel.app",');
console.log('      "http://localhost:3000"');
console.log('    ],');
console.log('    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],');
console.log('    "AllowedHeaders": ["*"],');
console.log('    "ExposeHeaders": ["ETag", "x-amz-version-id"],');
console.log('    "MaxAgeSeconds": 3600');
console.log('  }');
console.log(']');
console.log('```\n');

console.log('❗ Important Notes:\n');
console.log('• If CORS rule is MISSING → Add it via Cloudflare Dashboard');
console.log('• If CORS rule exists but uploads still fail → Click "Save" again');
console.log('• After saving, wait 5-10 minutes for changes to propagate');
console.log('• Check browser console (F12 → Console) for CORS errors');
console.log('• Clear browser cache (Ctrl+Shift+Del) after updating CORS\n');

console.log('🧪 Browser Console Test:\n');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Try uploading a thumbnail');
console.log('4. Look for errors containing "CORS" or "Network error"\n');

console.log('Expected Success Log:');
console.log('```');
console.log('✅ Part 1 uploaded (ETag: "...")');
console.log('```\n');

console.log('Expected CORS Error:');
console.log('```');
console.log('❌ XHR error for part 1: Network error (status: 0, readyState: 4)');
console.log('```\n');

console.log('✅ Diagnostic complete. See above for steps to verify CORS configuration.\n');
