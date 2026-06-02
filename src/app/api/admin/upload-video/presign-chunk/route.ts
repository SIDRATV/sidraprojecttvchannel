import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  r2Client,
  R2_BUCKET,
  fixPresignedUrl,
} from '@/lib/r2';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request: NextRequest) {
  try {
    // Auth — admin only
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = extractBearerToken(authHeader);
    const jwtPayload = token ? await verifyJwt(token) : null;
    if (!jwtPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', jwtPayload.sub)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { videoKey, chunkIndex, totalChunks, chunkSize, contentType } = body;

    if (!videoKey || chunkIndex === undefined || !totalChunks || !chunkSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build chunk key: videos/720p/[filename]-chunk-[index]-of-[total]
    const chunkKey = `${videoKey}-chunk-${chunkIndex}-of-${totalChunks}`;

    console.log(`📝 Generating presigned URL for chunk ${chunkIndex + 1}/${totalChunks}`);
    console.log(`   Key: ${chunkKey}`);
    console.log(`   Size: ${(chunkSize / 1024 / 1024).toFixed(1)}MB`);

    // Generate presigned URL for this chunk (1 hour expiry)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: chunkKey,
      ContentType: contentType || 'application/octet-stream',
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Fix presigned URL for Cloudflare R2 path-style access
    const fixedUrl = fixPresignedUrl(presignedUrl);

    console.log(`✅ Presigned URL generated for chunk ${chunkIndex + 1}/${totalChunks}`);

    return NextResponse.json({
      presignedUrl: fixedUrl,
      chunkKey,
      chunkIndex,
      totalChunks,
    });
  } catch (err) {
    console.error('presign-chunk error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to generate chunk upload URL: ${message}` }, { status: 500 });
  }
}
