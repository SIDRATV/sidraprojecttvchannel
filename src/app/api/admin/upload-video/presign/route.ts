import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  getPresignedUploadUrl,
  buildVideoKey,
  buildThumbnailKey,
  diagnosisR2,
} from '@/lib/r2';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;   // 2 GB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;     // 10 MB

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

    // CRITICAL: Check R2 credentials before proceeding
    const r2diagnosis = await diagnosisR2();
    if (!r2diagnosis.ok) {
      console.error(`❌ R2 Configuration Issue: ${r2diagnosis.message}`);
      return NextResponse.json(
        { error: `R2 configuration error: ${r2diagnosis.message}. Contact administrator.` },
        { status: 500 },
      );
    }

    // Parse request body (tiny JSON, not a file)
    const body = await request.json();
    const {
      title,
      quality,
      videoFilename,
      videoContentType,
      videoSize,
      thumbnailFilename,
      thumbnailContentType,
      thumbnailSize,
    } = body;

    if (!title || !quality || !videoFilename || !videoContentType || !thumbnailFilename || !thumbnailContentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_VIDEO_TYPES.includes(videoContentType)) {
      return NextResponse.json({ error: `Invalid video type: ${videoContentType}` }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(thumbnailContentType)) {
      return NextResponse.json({ error: `Invalid image type: ${thumbnailContentType}` }, { status: 400 });
    }
    if (videoSize && videoSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: `Video too large (${(videoSize / 1024 / 1024 / 1024).toFixed(2)}GB, max 2 GB)` }, { status: 400 });
    }
    if (thumbnailSize && thumbnailSize > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json({ error: `Thumbnail too large (${(thumbnailSize / 1024 / 1024).toFixed(1)}MB, max 10 MB)` }, { status: 400 });
    }

    // Build R2 keys
    const timestamp = Date.now();
    const videoExt = videoFilename.split('.').pop() || 'mp4';
    const thumbExt = thumbnailFilename.split('.').pop() || 'jpg';
    const baseName = String(title).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);

    const videoKey = buildVideoKey(`${timestamp}_${baseName}.${videoExt}`, quality);
    const thumbnailKey = buildThumbnailKey(`${timestamp}_${baseName}.${thumbExt}`);

    // Generate presigned PUT URLs
    // Expiry time depends on file size (estimate: 30 seconds per 10MB + 5min buffer)
    const videoExpirySeconds = Math.max(
      1800, // Minimum 30 minutes for reliability
      Math.ceil((videoSize / (10 * 1024 * 1024)) * 30) + 300 // 30s per 10MB + 5min buffer
    );
    console.log(`📝 Presigned URL expiry: ${videoExpirySeconds}s (${(videoExpirySeconds / 60).toFixed(1)} min) for ${(videoSize / 1024 / 1024).toFixed(1)}MB video`);

    const [videoUploadUrl, thumbnailUploadUrl] = await Promise.all([
      getPresignedUploadUrl(videoKey, videoContentType, videoExpirySeconds),
      getPresignedUploadUrl(thumbnailKey, thumbnailContentType, 1800), // 30 min for thumbnail
    ]);

    return NextResponse.json({
      videoKey,
      thumbnailKey,
      videoUploadUrl,
      thumbnailUploadUrl,
    });
  } catch (err) {
    console.error('presign error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to generate upload URLs: ${message}` }, { status: 500 });
  }
}
