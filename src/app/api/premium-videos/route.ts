import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getThumbnailPublicUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 50);
    const offset = Number(url.searchParams.get('offset') || '0');
    const categoryId = url.searchParams.get('category_id');

    const supabase = createServerClient();

    let query = (supabase as any)
      .from('premium_videos')
      .select(`
        id,
        title,
        description,
        category_id,
        thumbnail_key,
        quality_options,
        duration,
        is_premium,
        min_plan,
        views,
        likes,
        created_at,
        categories:category_id (name, icon, color)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching premium videos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map thumbnail keys to public URLs
    const videos = (data || []).map((video: any) => ({
      ...video,
      thumbnail_url: video.thumbnail_key
        ? getThumbnailPublicUrl(video.thumbnail_key)
        : null,
    }));

    return NextResponse.json({ videos, count: videos.length });
  } catch (err) {
    console.error('Premium videos API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch premium videos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
