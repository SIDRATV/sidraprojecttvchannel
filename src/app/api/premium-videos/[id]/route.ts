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
    try { await (supabase as any).rpc('increment_premium_video_views', { vid: videoId }); } catch {}

    // Build thumbnail URL (signed, 24h expiry)
    let thumbnailUrl: string | null = null;
    if (video.thumbnail_key) {
      try {
        thumbnailUrl = await getSignedThumbnailUrl(video.thumbnail_key);
      } catch (e) {
        console.error('Failed to sign thumbnail URL:', e);
      }
    }

    // Determine the video key for the requested quality
    const qualityKeyMap: Record<string, string | null> = {
      '480p': video.video_key_480p || null,
      '720p': video.video_key_720p || null,
      '1080p': video.video_key_1080p || null,
    };

    const videoKey = qualityKeyMap[quality];
    const effectiveKey = videoKey || video.video_key_720p || video.video_key_480p || video.video_key_1080p;

    if (!effectiveKey) {
      return NextResponse.json({ error: 'No video file available' }, { status: 404 });
    }

    let signedUrl: string;
    try {
      signedUrl = await getSignedVideoUrl(effectiveKey, 7200);
    } catch (e) {
      console.error('Failed to sign video URL for key:', effectiveKey, e);
      return NextResponse.json({ error: 'Failed to generate video stream URL' }, { status: 500 });
    }

    const effectiveQuality = videoKey
      ? quality
      : Object.entries(qualityKeyMap).find(([, v]) => v === effectiveKey)?.[0] || quality;

    return NextResponse.json({
      video: {
        ...video,
        thumbnail_url: thumbnailUrl,
      },
      stream_url: signedUrl,
      quality: effectiveQuality,
      available_qualities: (video.quality_options || []),
    });
  } catch (err) {
    console.error('Premium video detail error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
