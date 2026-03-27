import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  uploadToR2,
  buildVideoKey,
  buildThumbnailKey,
} from '@/lib/r2';

// Max file sizes
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check — admin only
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

    // Check admin
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();

    const videoFile = formData.get('video') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const title = (formData.get('title') as string) || 'Untitled Video';
    const description = (formData.get('description') as string) || '';
    const categoryId = formData.get('category_id') as string | null;
    const quality = (formData.get('quality') as string) || '720p';
    const minPlan = (formData.get('min_plan') as string) || 'pro';

    // 3. Validate
    if (!videoFile) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
    }
    if (!thumbnailFile) {
      return NextResponse.json({ error: 'Thumbnail image is required' }, { status: 400 });
    }

    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: `Invalid video type: ${videoFile.type}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}` },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(thumbnailFile.type)) {
      return NextResponse.json(
        { error: `Invalid image type: ${thumbnailFile.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 },
      );
    }
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video too large (${(videoFile.size / 1024 / 1024).toFixed(1)} MB). Max: 500 MB` },
        { status: 400 },
      );
    }
    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json(
        { error: `Thumbnail too large (${(thumbnailFile.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB` },
        { status: 400 },
      );
    }

    if (!['480p', '720p', '1080p'].includes(quality)) {
      return NextResponse.json({ error: 'Quality must be 480p, 720p, or 1080p' }, { status: 400 });
    }
    if (!['pro', 'premium', 'vip'].includes(minPlan)) {
      return NextResponse.json({ error: 'min_plan must be pro, premium, or vip' }, { status: 400 });
    }

    // 4. Build R2 keys
    const timestamp = Date.now();
    const videoExt = videoFile.name.split('.').pop() || 'mp4';
    const thumbExt = thumbnailFile.name.split('.').pop() || 'jpg';
    const baseName = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);

    const videoKey = buildVideoKey(`${timestamp}_${baseName}.${videoExt}`, quality);
    const thumbnailKey = buildThumbnailKey(`${timestamp}_${baseName}.${thumbExt}`);

    // 5. Upload to R2
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());

    const [videoResult, thumbnailResult] = await Promise.all([
      uploadToR2(videoKey, videoBuffer, videoFile.type),
      uploadToR2(thumbnailKey, thumbnailBuffer, thumbnailFile.type),
    ]);

    // 6. Insert into Supabase
    const qualityKeyField = `video_key_${quality}` as 'video_key_480p' | 'video_key_720p' | 'video_key_1080p';

    const insertData: Record<string, unknown> = {
      title,
      description,
      category_id: categoryId || null,
      thumbnail_key: thumbnailKey,
      [qualityKeyField]: videoKey,
      quality_options: [quality],
      file_size: videoResult.size,
      is_premium: true,
      min_plan: minPlan,
      uploaded_by: user.id,
    };

    const { data: video, error: insertError } = await (supabase as any)
      .from('premium_videos')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      // Attempt cleanup on DB failure
      console.error('DB insert failed:', insertError);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      video,
      storage: {
        video_key: videoKey,
        thumbnail_key: thumbnailKey,
        video_size: videoResult.size,
        thumbnail_size: thumbnailResult.size,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Increase Next.js body size limit for video uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
