import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  getPresignedUploadUrl,
  buildVideoKey,
  buildThumbnailKey,
} from '@/lib/r2';

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;   // 500 MB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    // Auth — admin only
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
      return NextResponse.json({ error: `Video too large (max 500 MB)` }, { status: 400 });
    }
    if (thumbnailSize && thumbnailSize > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json({ error: `Thumbnail too large (max 10 MB)` }, { status: 400 });
    }

    // Build R2 keys
    const timestamp = Date.now();
    const videoExt = videoFilename.split('.').pop() || 'mp4';
    const thumbExt = thumbnailFilename.split('.').pop() || 'jpg';
    const baseName = String(title).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);

    const videoKey = buildVideoKey(`${timestamp}_${baseName}.${videoExt}`, quality);
    const thumbnailKey = buildThumbnailKey(`${timestamp}_${baseName}.${thumbExt}`);

    // Generate presigned PUT URLs (15 minutes to complete the upload)
    const [videoUploadUrl, thumbnailUploadUrl] = await Promise.all([
      getPresignedUploadUrl(videoKey, videoContentType, 900),
      getPresignedUploadUrl(thumbnailKey, thumbnailContentType, 900),
    ]);

    return NextResponse.json({
      videoKey,
      thumbnailKey,
      videoUploadUrl,
      thumbnailUploadUrl,
    });
  } catch (err) {
    console.error('presign error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
