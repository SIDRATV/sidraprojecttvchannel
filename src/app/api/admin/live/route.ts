import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/live — list all live streams
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await (supabase as any)
    .from('live_streams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ streams: data ?? [] });
}

// POST /api/admin/live — create live stream
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { title, description, stream_url, stream_type, category, streamer, is_live, is_featured } = body;

  if (!title || !stream_url || !category || !streamer) {
    return NextResponse.json({ error: 'title, stream_url, category, streamer requis' }, { status: 400 });
  }

  // Extract YouTube ID if YouTube URL, else use as-is
  let youtube_id: string | null = null;
  const ytMatch = stream_url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) youtube_id = ytMatch[1];

  const image = youtube_id
    ? `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`
    : '';

  const { data, error } = await (supabase as any)
    .from('live_streams')
    .insert([{
      title,
      description: description ?? '',
      image,
      stream_url,
      youtube_id,
      stream_type: stream_type ?? 'youtube', // youtube | obs | other
      category,
      streamer,
      is_live: is_live ?? false,
      is_featured: is_featured ?? false,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stream: data }, { status: 201 });
}

// PATCH /api/admin/live — update live stream
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  if (updates.stream_url) {
    const ytMatch = updates.stream_url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      updates.youtube_id = ytMatch[1];
      updates.image = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    }
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await (supabase as any)
    .from('live_streams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stream: data });
}

// DELETE /api/admin/live — delete live stream
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'videos');
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await (supabase as any).from('live_streams').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
