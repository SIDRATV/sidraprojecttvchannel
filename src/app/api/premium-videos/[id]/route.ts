import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSignedVideoUrl, getSignedThumbnailUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const url = new URL(request.url);
    const quality = url.searchParams.get('quality') || '720p';

    if (!['480p', '720p', '1080p'].includes(quality)) {
      return NextResponse.json({ error: 'Invalid quality' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch video metadata
    const { data: video, error } = await (supabase as any)
      .from('premium_videos')
      .select(`
        *,
        categories:category_id (name, icon, color)
      `)
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Increment views
    await (supabase as any).rpc('increment_premium_video_views', { vid: videoId }).catch(() => {});

    // Build thumbnail URL (signed, 24h expiry)
    const thumbnailUrl = video.thumbnail_key
      ? await getSignedThumbnailUrl(video.thumbnail_key)
      : null;

    // Determine the video key for the requested quality
    const qualityKeyMap: Record<string, string> = {
      '480p': video.video_key_480p,
      '720p': video.video_key_720p,
      '1080p': video.video_key_1080p,
    };

    const videoKey = qualityKeyMap[quality];

    if (!videoKey) {
      // Try fallback quality
      const fallbackKey = video.video_key_720p || video.video_key_480p || video.video_key_1080p;
      if (!fallbackKey) {
        return NextResponse.json({ error: 'No video file available' }, { status: 404 });
      }
      const signedUrl = await getSignedVideoUrl(fallbackKey, 7200);
      return NextResponse.json({
        video: {
          ...video,
          thumbnail_url: thumbnailUrl,
        },
        stream_url: signedUrl,
        quality: Object.keys(qualityKeyMap).find(k => qualityKeyMap[k] === fallbackKey) || quality,
        available_qualities: (video.quality_options || []),
      });
    }

    // Generate signed URL (2 hours expiry)
    const signedUrl = await getSignedVideoUrl(videoKey, 7200);

    return NextResponse.json({
      video: {
        ...video,
        thumbnail_url: thumbnailUrl,
      },
      stream_url: signedUrl,
      quality,
      available_qualities: (video.quality_options || []),
    });
  } catch (err) {
    console.error('Premium video detail error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
