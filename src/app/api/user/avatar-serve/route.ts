import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fixPresignedUrl } from '@/lib/r2';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY!;
const AVATAR_BUCKET = process.env.CLOUDFLARE_R2_AVATAR_BUCKET || 'avatar-user-url';
const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

// GET /api/user/avatar-serve?uid={userId}
// Generates a fresh presigned URL for the user's avatar and redirects to it
// Heavily cached to avoid regenerating presigned URLs constantly

// Simple in-memory cache to avoid regenerating presigned URLs (resets on server restart)
const PRESIGNED_CACHE = new Map<string, { url: string; expiry: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid || !/^[0-9a-f-]{36}$/.test(uid)) {
    console.warn(`❌ Invalid uid format: ${uid}`);
    return NextResponse.json({ error: 'Invalid uid' }, { status: 400 });
  }

  const key = `avatars/${uid}`;
  const now = Date.now();

  // Check cache first
  const cached = PRESIGNED_CACHE.get(uid);
  if (cached && cached.expiry > now) {
    console.log(`✅ Using cached presigned URL for ${uid} (expires in ${Math.round((cached.expiry - now) / 1000)}s)`);
    return NextResponse.redirect(cached.url, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=86400', // Browser caches for 24 hours
      },
    });
  }

  try {
    console.log(`📥 Generating presigned URL for user ${uid}:`);
    console.log(`   Bucket: ${AVATAR_BUCKET}`);
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Key: ${key}`);

    const command = new GetObjectCommand({ Bucket: AVATAR_BUCKET, Key: key });
    // Generate presigned URL valid for 24 hours
    let signedUrl = await getSignedUrl(r2, command, { expiresIn: 86400 });
    
    // CRITICAL: Fix the presigned URL to ensure bucket is in path for Cloudflare R2
    signedUrl = fixPresignedUrl(signedUrl, AVATAR_BUCKET);
    console.log(`✅ Presigned URL generated: ${signedUrl.substring(0, 100)}...`);

    // Cache for 23.5 hours (less than presigned URL expiry to refresh before expiry)
    PRESIGNED_CACHE.set(uid, {
      url: signedUrl,
      expiry: now + (23.5 * 60 * 60 * 1000),
    });

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        // Tell browsers to cache the redirect for 24 hours
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Avatar serve error for ${uid}:`, err);
    console.error(`   Error message: ${message}`);
    // Return 404 if object doesn't exist
    return new NextResponse(null, { status: 404 });
  }
}
