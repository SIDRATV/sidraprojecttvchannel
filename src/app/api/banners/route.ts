import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/banners — fetch active sponsored banners for public display
export async function GET() {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from('sponsored_banners')
      .select('id, title, description, image_url, video_url, media_type, autoplay, display_duration, link_url, banner_type, starts_at, ends_at, priority, partner_id')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ banners: data || [] });
  } catch (err: any) {
    return NextResponse.json({ banners: [], error: err.message }, { status: 500 });
  }
}
