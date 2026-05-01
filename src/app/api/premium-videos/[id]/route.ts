import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSignedVideoUrl, getSignedThumbnailUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Plan hierarchy: higher index = higher tier
const PLAN_LEVELS: Record<string, number> = { pro: 1, premium: 2, vip: 3 };

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

    // Require auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createServerClient();

    // Verify user identity
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify active, non-expired subscription
    const { data: userRow } = await (supabase as any)
      .from('users')
      .select('premium_plan, premium_expires_at')
      .eq('id', user.id)
      .single();

    const hasPlan = !!userRow?.premium_plan;
    const notExpired = !userRow?.premium_expires_at ||
      new Date(userRow.premium_expires_at) > new Date();

    if (!hasPlan || !notExpired) {
      return NextResponse.json({ error: 'Subscription required or expired' }, { status: 403 });
    }

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

    // Check plan level is sufficient for this video
    const userLevel = PLAN_LEVELS[userRow.premium_plan] ?? 0;
    const requiredLevel = PLAN_LEVELS[video.min_plan] ?? 1;
    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { error: `Plan ${video.min_plan} or higher required` },
        { status: 403 }
      );
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
