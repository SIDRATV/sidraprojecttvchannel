#!/usr/bin/env node

/**
 * Test script pour vérifier l'upload d'avatar vers Cloudflare R2
 * À exécuter après le démarrage du serveur
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_URL = 'http://localhost:3000/api/user/avatar';
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || 'your-test-jwt-token';
const TEST_FILE = path.join(__dirname, 'test-avatar.png');

console.log('🧪 Avatar Upload Test');
console.log('====================\n');

// Créer une image de test (PNG 1x1)
function createTestImage() {
  // PNG header + minimal 1x1 transparent PNG
  const png = Buffer.from([
    // PNG signature
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    // IHDR chunk (13 bytes)
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89,
    // IDAT chunk (0 bytes - transparent)
    0x00, 0x00, 0x00, 0x00, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00,
    0x01, 0xE5, 0x27, 0xDE, 0xFC,
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(TEST_FILE, png);
  console.log(`✅ Created test image: ${TEST_FILE}`);
  console.log(`   Size: ${png.length} bytes\n`);
  return png;
}

// Test the upload
async function testUpload() {
  if (!TEST_TOKEN || TEST_TOKEN === 'your-test-jwt-token') {
    console.error('❌ Error: TEST_JWT_TOKEN not set');
    console.log('\nUsage:');
    console.log('  export TEST_JWT_TOKEN="your-jwt-token"');
    console.log('  node test-avatar-upload.js\n');
    process.exit(1);
  }

  try {
    const imageBuffer = createTestImage();

    console.log(`📡 Uploading to: ${API_URL}`);
    console.log(`   Token: ${TEST_TOKEN.substring(0, 20)}...`);
    console.log(`   Size: ${imageBuffer.length} bytes\n`);

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-avatar.png');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: formData,
    });

    const data = await response.json();

    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📨 Response Body:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`\n✅ Upload successful!`);
      console.log(`   Avatar URL: ${data.url}`);
      
      // Test serve endpoint
      console.log(`\n📥 Testing serve endpoint...`);
      const uid = data.url.split('uid=')[1];
      if (uid) {
        const serveUrl = `http://localhost:3000/api/user/avatar-serve?uid=${uid}`;
        console.log(`   GET ${serveUrl}`);
        
        const serveResponse = await fetch(serveUrl);
        console.log(`   Status: ${serveResponse.status}`);
        console.log(`   Location: ${serveResponse.headers.get('location')}`);
        
        if (serveResponse.ok || serveResponse.status === 302) {
          console.log(`   ✅ Serve endpoint working!`);
        }
      }
    } else {
      console.log(`\n❌ Upload failed!`);
    }

    // Cleanup
    fs.unlinkSync(TEST_FILE);
    console.log(`\n🧹 Cleaned up test image`);

  } catch (err) {
    console.error(`❌ Test error:`, err.message);
    if (fs.existsSync(TEST_FILE)) {
      fs.unlinkSync(TEST_FILE);
    }
    process.exit(1);
  }
}

// Check if running in Node.js with fetch support (v18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Error: Node.js 18+ required (for fetch API)');
  process.exit(1);
}

testUpload().catch(err => {
  console.error(err);
  process.exit(1);
});
