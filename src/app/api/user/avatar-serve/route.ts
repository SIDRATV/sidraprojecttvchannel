import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid || !/^[0-9a-f-]{36}$/.test(uid)) {
    console.warn(`❌ Invalid uid format: ${uid}`);
    return NextResponse.json({ error: 'Invalid uid' }, { status: 400 });
  }

  const key = `avatars/${uid}`;

  try {
    console.log(`📥 Serving avatar for user ${uid}:`);
    console.log(`   Bucket: ${AVATAR_BUCKET}`);
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Key: ${key}`);

    const command = new GetObjectCommand({ Bucket: AVATAR_BUCKET, Key: key });
    // Short-lived URL (1 hour) — browser will re-fetch via this proxy when needed
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    console.log(`✅ Presigned URL generated successfully for ${uid}`);

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        // Tell browsers to cache the redirect for 55 minutes (slightly less than signed URL expiry)
        'Cache-Control': 'public, max-age=3300',
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
