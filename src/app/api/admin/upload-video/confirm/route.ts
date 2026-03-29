import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
      uploaded_by: user.id,
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
