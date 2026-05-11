import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/premium-videos/[id]/comments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const videoId = params.id;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { data, error } = await supabaseAdmin
    .from('premium_video_comments')
    .select(`
      id, content, likes, created_at,
      users:user_id (id, full_name, avatar_url)
    `)
    .eq('premium_video_id', videoId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

// POST /api/premium-videos/[id]/comments — requires auth
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const videoId = params.id;
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = auth.slice(7);
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const content: string = (body.content || '').trim();
  if (!content || content.length > 1000) {
    return NextResponse.json({ error: 'Contenu invalide (1–1000 caractères)' }, { status: 400 });
  }

  // Check banned words
  const { data: banned } = await supabaseAdmin.from('banned_words').select('word');
  const bannedList: string[] = (banned || []).map((r: any) => r.word.toLowerCase());
  const lower = content.toLowerCase();
  const found = bannedList.find(w => lower.includes(w));
  if (found) {
    return NextResponse.json(
      { error: 'Votre commentaire contient du contenu inapproprié et a été refusé.' },
      { status: 422 },
    );
  }

  const { data: comment, error: insertErr } = await supabaseAdmin
    .from('premium_video_comments')
    .insert({ premium_video_id: videoId, user_id: user.id, content })
    .select(`id, content, likes, created_at, users:user_id (id, full_name, avatar_url)`)
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ comment }, { status: 201 });
}

// DELETE /api/premium-videos/[id]/comments?commentId=xxx — own comment only
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = auth.slice(7);
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = new URL(req.url).searchParams.get('commentId');
  if (!commentId) return NextResponse.json({ error: 'commentId requis' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('premium_video_comments')
    .update({ is_deleted: true, deleted_by: user.id, deleted_reason: 'Supprimé par l\'auteur' })
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
