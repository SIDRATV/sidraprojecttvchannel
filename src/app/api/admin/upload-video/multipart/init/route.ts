import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { initiateMultipartUpload, buildVideoKey, buildThumbnailKey } from '@/lib/r2';

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10 MB

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

    // Parse request body
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
      return NextResponse.json(
        { error: `Video too large (${(videoSize / 1024 / 1024 / 1024).toFixed(2)}GB, max 2 GB)` },
        { status: 400 },
      );
    }
    if (thumbnailSize && thumbnailSize > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json(
        { error: `Thumbnail too large (${(thumbnailSize / 1024 / 1024).toFixed(1)}MB, max 10 MB)` },
        { status: 400 },
      );
    }

    // Build R2 keys
    const timestamp = Date.now();
    const videoExt = videoFilename.split('.').pop() || 'mp4';
    const thumbExt = thumbnailFilename.split('.').pop() || 'jpg';
    const baseName = String(title).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);

    const videoKey = buildVideoKey(`${timestamp}_${baseName}.${videoExt}`, quality);
    const thumbnailKey = buildThumbnailKey(`${timestamp}_${baseName}.${thumbExt}`);

    // Initiate multipart uploads for both video and thumbnail
    const [videoUploadId, thumbnailUploadId] = await Promise.all([
      initiateMultipartUpload(videoKey, videoContentType),
      initiateMultipartUpload(thumbnailKey, thumbnailContentType),
    ]);

    return NextResponse.json({
      videoKey,
      thumbnailKey,
      videoUploadId,
      thumbnailUploadId,
      partSize: 5 * 1024 * 1024, // 5 MB per part
    });
  } catch (err) {
    console.error('multipart init error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to initiate multipart upload: ${message}` },
      { status: 500 },
    );
  }
}
