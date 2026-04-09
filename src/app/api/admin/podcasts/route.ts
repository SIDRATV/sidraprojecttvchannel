import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/podcasts — list all podcasts
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await (supabase as any)
    .from('podcasts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ podcasts: data ?? [] });
}

// POST /api/admin/podcasts — create podcast
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { title, description, youtube_id, category, creator, duration, is_featured } = body;

  if (!title || !youtube_id || !category || !creator) {
    return NextResponse.json({ error: 'title, youtube_id, category, creator requis' }, { status: 400 });
  }

  // Build image from YouTube thumbnail
  const image = `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`;

  const { data, error } = await (supabase as any)
    .from('podcasts')
    .insert([{
      title,
      description: description ?? '',
      image,
      youtube_id,
      duration: duration ?? '',
      category,
      creator,
      is_featured: is_featured ?? false,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ podcast: data }, { status: 201 });
}

// PATCH /api/admin/podcasts — update podcast
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  if (updates.youtube_id) {
    updates.image = `https://img.youtube.com/vi/${updates.youtube_id}/maxresdefault.jpg`;
  }

  const { data, error } = await (supabase as any)
    .from('podcasts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ podcast: data });
}

// DELETE /api/admin/podcasts — delete podcast
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await (supabase as any).from('podcasts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
