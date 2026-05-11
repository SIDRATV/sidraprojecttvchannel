import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/premium-videos/[id]/comments
// Returns top-level comments sorted by net score DESC, with nested replies
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;

  // Optional auth — include current user's votes when token provided
  let userId: string | null = null;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(auth.slice(7));
    userId = user?.id ?? null;
  }

  const { data: allComments, error } = await supabaseAdmin
    .from('premium_video_comments')
    .select(`id, content, likes, dislikes, parent_id, created_at,
             users:user_id (id, full_name, avatar_url)`)
    .eq('premium_video_id', videoId)
    .eq('is_deleted', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!allComments?.length) return NextResponse.json({ comments: [], total: 0 });

  // Build user-votes map
  const userVotes: Record<string, 1 | -1> = {};
  if (userId) {
    const { data: votes } = await supabaseAdmin
      .from('comment_votes')
      .select('comment_id, vote')
      .eq('user_id', userId)
      .in('comment_id', (allComments as any[]).map((c: any) => c.id));
    (votes || []).forEach((v: any) => { userVotes[v.comment_id] = v.vote; });
  }

  // Build replies map
  const repliesMap: Record<string, any[]> = {};
  (allComments as any[]).filter((c: any) => c.parent_id).forEach((r: any) => {
    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
    repliesMap[r.parent_id].push({ ...r, userVote: userVotes[r.id] ?? null });
  });

  const topLevel = (allComments as any[])
    .filter((c: any) => !c.parent_id)
    .map((c: any) => ({
      ...c,
      userVote: userVotes[c.id] ?? null,
      replies: (repliesMap[c.id] || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }))
    .sort((a: any, b: any) => (b.likes - b.dislikes) - (a.likes - a.dislikes));

  return NextResponse.json({ comments: topLevel, total: topLevel.length });
}

// POST /api/premium-videos/[id]/comments — create comment or reply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const content: string = (body.content || '').trim();
  const parentId: string | null = body.parentId || null;

  if (!content || content.length > 1000) {
    return NextResponse.json({ error: 'Contenu invalide (1–1000 caractères)' }, { status: 400 });
  }

  // Banned words
  const { data: banned } = await supabaseAdmin.from('banned_words').select('word');
  const lower = content.toLowerCase();
  if ((banned || []).some((r: any) => lower.includes(r.word.toLowerCase()))) {
    return NextResponse.json({ error: 'Votre commentaire contient du contenu inapproprié.' }, { status: 422 });
  }

  const { data: comment, error: insertErr } = await supabaseAdmin
    .from('premium_video_comments')
    .insert({ premium_video_id: videoId, user_id: user.id, content, parent_id: parentId })
    .select(`id, content, likes, dislikes, parent_id, created_at, users:user_id (id, full_name, avatar_url)`)
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ comment: { ...(comment as any), userVote: null, replies: [] } }, { status: 201 });
}

// PATCH /api/premium-videos/[id]/comments — vote on a comment
// Body: { commentId: string, vote: 1 | -1 | 0 }  (0 removes vote)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { commentId, vote: newVote } = await req.json();
  if (!commentId) return NextResponse.json({ error: 'commentId requis' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('comment_votes').select('vote').eq('comment_id', commentId).eq('user_id', user.id).maybeSingle();
  const oldVote: number = (existing as any)?.vote ?? 0;

  let likesDelta = 0, dislikesDelta = 0;
  if (oldVote === 1) likesDelta--;
  if (oldVote === -1) dislikesDelta--;
  if (newVote === 1) likesDelta++;
  if (newVote === -1) dislikesDelta++;

  if (newVote === 0) {
    await supabaseAdmin.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
  } else {
    await supabaseAdmin.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote: newVote });
  }

  const { data: current } = await supabaseAdmin
    .from('premium_video_comments').select('likes, dislikes').eq('id', commentId).single();
  const newLikes = Math.max(0, ((current as any)?.likes ?? 0) + likesDelta);
  const newDislikes = Math.max(0, ((current as any)?.dislikes ?? 0) + dislikesDelta);
  await supabaseAdmin.from('premium_video_comments')
    .update({ likes: newLikes, dislikes: newDislikes }).eq('id', commentId);

  return NextResponse.json({ vote: newVote, likes: newLikes, dislikes: newDislikes });
}

// DELETE /api/premium-videos/[id]/comments?commentId=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = new URL(req.url).searchParams.get('commentId');
  if (!commentId) return NextResponse.json({ error: 'commentId requis' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('premium_video_comments')
    .update({ is_deleted: true, deleted_by: user.id, deleted_reason: "Supprimé par l'auteur" })
    .eq('id', commentId).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
