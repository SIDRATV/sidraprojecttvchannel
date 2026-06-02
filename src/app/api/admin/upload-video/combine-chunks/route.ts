import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { r2Client, R2_BUCKET, R2_FOLDERS } from '@/lib/r2';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
    const { videoKey, totalChunks } = body;

    if (!videoKey || !totalChunks) {
      return NextResponse.json({ error: 'Missing videoKey or totalChunks' }, { status: 400 });
    }

    console.log(`🔗 Starting chunk combination for ${videoKey} (${totalChunks} chunks)`);

    // List and download all chunks
    const chunks: { index: number; data: Buffer }[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${videoKey}-chunk-${i}-of-${totalChunks}`;
      
      try {
        console.log(`📥 Downloading chunk ${i + 1}/${totalChunks}: ${chunkKey}`);
        const getCmd = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: chunkKey,
        });

        const response = await r2Client.send(getCmd);
        const buffer = await response.Body?.transformToByteArray();
        
        if (!buffer) {
          throw new Error(`Empty chunk at index ${i}`);
        }

        chunks.push({
          index: i,
          data: Buffer.from(buffer),
        });

        console.log(`✅ Chunk ${i + 1} downloaded (${buffer.length} bytes)`);
      } catch (err) {
        console.error(`❌ Failed to download chunk ${i}:`, err);
        throw err;
      }
    }

    // Sort chunks by index and combine
    chunks.sort((a, b) => a.index - b.index);
    const combinedBuffer = Buffer.concat(chunks.map(c => c.data));
    console.log(`📦 Combined size: ${(combinedBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    // Upload combined file
    try {
      console.log(`📤 Uploading combined file: ${videoKey}`);
      const putCmd = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: videoKey,
        Body: combinedBuffer,
        ContentType: 'video/mp4',
      });

      await r2Client.send(putCmd);
      console.log(`✅ Combined file uploaded`);
    } catch (err) {
      console.error(`❌ Failed to upload combined file:`, err);
      throw err;
    }

    // Delete all chunk files
    console.log(`🗑️  Deleting chunks...`);
    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${videoKey}-chunk-${i}-of-${totalChunks}`;
      try {
        const delCmd = new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: chunkKey,
        });
        await r2Client.send(delCmd);
        console.log(`✅ Chunk ${i + 1} deleted`);
      } catch (err) {
        console.warn(`⚠️  Failed to delete chunk ${i}:`, err);
        // Don't fail entirely, chunks can be cleaned up later
      }
    }

    console.log(`✅ Chunk combination complete`);

    return NextResponse.json({
      success: true,
      videoKey,
      size: combinedBuffer.length,
    });
  } catch (err) {
    console.error('combine-chunks error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to combine chunks: ${message}` }, { status: 500 });
  }
}
