import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSignedThumbnailUrl } from '@/lib/r2';

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

    // Map thumbnail keys to signed URLs (24h expiry)
    const videos = await Promise.all(
      (data || []).map(async (video: any) => {
        let thumbnail_url: string | null = null;
        if (video.thumbnail_key) {
          try {
            thumbnail_url = await getSignedThumbnailUrl(video.thumbnail_key);
          } catch {
            console.error('Failed to sign thumbnail for video:', video.id);
          }
        }
        return { ...video, thumbnail_url };
      }),
    );

    return NextResponse.json({ videos, count: videos.length });
  } catch (err) {
    console.error('Premium videos API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch premium videos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
