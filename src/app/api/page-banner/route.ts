import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/page-banner?page=podcast|live  — public read
export async function GET(request: NextRequest) {
  const page = new URL(request.url).searchParams.get('page');
  if (!page || !['podcast', 'live'].includes(page)) {
    return NextResponse.json({ error: 'page must be podcast or live' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('site_settings')
    .select('value')
    .eq('key', `${page}_banner`)
    .single();

  return NextResponse.json(data?.value ?? null);
}

// PATCH /api/page-banner — admin only
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase, admin } = auth;

  const body = await request.json();
  const { page, type, url, title, subtitle } = body;
  if (!page || !['podcast', 'live'].includes(page)) {
    return NextResponse.json({ error: 'page must be podcast or live' }, { status: 400 });
  }
  if (!type || !['image', 'video'].includes(type)) {
    return NextResponse.json({ error: 'type must be image or video' }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: 'url requis' }, { status: 400 });
  }

  const value = { type, url, title: title ?? '', subtitle: subtitle ?? '' };

  const { error } = await (supabase as any)
    .from('site_settings')
    .upsert(
      [{ key: `${page}_banner`, value, updated_by: admin.id }],
      { onConflict: 'key' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, banner: value });
}
