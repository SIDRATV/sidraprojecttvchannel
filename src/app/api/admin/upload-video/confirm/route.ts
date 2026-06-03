import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

export async function POST(request: NextRequest) {
  try {
    // Auth — admin only (local JWT)
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const jwtPayload = await verifyJwt(token);
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
    const {
      videoKey,
      videoSize,
      thumbnailKey,
      thumbnailSize,
      title,
      description,
      categoryId,
      quality,
      minPlan,
    } = body;

    if (!videoKey || !thumbnailKey || !title || !quality || !minPlan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['480p', '720p', '1080p'].includes(quality)) {
      return NextResponse.json({ error: 'Quality must be 480p, 720p, or 1080p' }, { status: 400 });
    }
    if (!['pro', 'premium', 'vip'].includes(minPlan)) {
      return NextResponse.json({ error: 'min_plan must be pro, premium, or vip' }, { status: 400 });
    }

    const qualityKeyField = `video_key_${quality}` as 'video_key_480p' | 'video_key_720p' | 'video_key_1080p';

    // Get the next sort_order value
    const { data: lastVideo } = await (supabase as any)
      .from('premium_videos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastVideo?.sort_order ?? -10) + 10;

    const insertData: Record<string, unknown> = {
      title,
      description: description || '',
      category_id: categoryId || null,
      thumbnail_key: thumbnailKey,
      [qualityKeyField]: videoKey,
      quality_options: [quality],
      file_size: videoSize || 0,
      is_premium: true,
      min_plan: minPlan,
      uploaded_by: jwtPayload.sub,
      sort_order: nextSortOrder,
    };

    const { data: video, error: insertError } = await (supabase as any)
      .from('premium_videos')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('DB insert failed:', insertError);
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      video,
      storage: { video_key: videoKey, thumbnail_key: thumbnailKey, video_size: videoSize, thumbnail_size: thumbnailSize },
    });
  } catch (err) {
    console.error('confirm error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
