#!/usr/bin/env node

/**
 * Vérifier les fichiers avatar dans Cloudflare R2
 * Affiche les objets stockés dans le bucket avatar-user-url
 */

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const AVATAR_BUCKET = process.env.CLOUDFLARE_R2_AVATAR_BUCKET || 'avatar-user-url';
const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

console.log('🔍 Cloudflare R2 Avatar Bucket Inspector');
console.log('=========================================\n');

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('❌ Error: Missing Cloudflare credentials in .env.local');
  console.log('\nRequired variables:');
  console.log('  CLOUDFLARE_ACCOUNT_ID');
  console.log('  CLOUDFLARE_ACCESS_KEY_ID');
  console.log('  CLOUDFLARE_SECRET_ACCESS_KEY');
  console.log('  CLOUDFLARE_R2_AVATAR_BUCKET (optional, defaults to avatar-user-url)');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

async function listAvatars() {
  try {
    console.log(`📦 Configuration:`);
    console.log(`   Bucket: ${AVATAR_BUCKET}`);
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Account ID: ${ACCOUNT_ID.substring(0, 8)}...`);
    console.log(`\n🔄 Fetching avatars from R2...\n`);

    const command = new ListObjectsV2Command({
      Bucket: AVATAR_BUCKET,
      Prefix: 'avatars/',
    });

    const response = await r2.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log(`⚠️  No avatars found in R2 bucket`);
      console.log(`   The avatars/ prefix is empty`);
      return;
    }

    console.log(`✅ Found ${response.Contents.length} avatar(s):\n`);

    response.Contents.forEach((obj, i) => {
      const sizeKB = (obj.Size / 1024).toFixed(2);
      const date = obj.LastModified ? new Date(obj.LastModified).toLocaleString() : 'Unknown';
      
      console.log(`${i + 1}. ${obj.Key}`);
      console.log(`   Size: ${obj.Size} bytes (${sizeKB} KB)`);
      console.log(`   Last Modified: ${date}`);
      console.log(`   ETag: ${obj.ETag}`);
      
      // Extract user ID from key format: avatars/{userId}
      const userId = obj.Key.replace('avatars/', '');
      const serveUrl = `/api/user/avatar-serve?uid=${userId}`;
      console.log(`   Serve URL: ${serveUrl}`);
      console.log('');
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total avatars: ${response.Contents.length}`);
    const totalSize = response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
    console.log(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);

  } catch (err) {
    console.error(`❌ Error:`, err.message);
    if (err.$metadata?.httpStatusCode === 403) {
      console.error(`\n⚠️  Access Denied - Check your Cloudflare R2 credentials`);
    } else if (err.$metadata?.httpStatusCode === 404) {
      console.error(`\n⚠️  Bucket Not Found - Check CLOUDFLARE_R2_AVATAR_BUCKET`);
    }
    process.exit(1);
  }
}

listAvatars();
