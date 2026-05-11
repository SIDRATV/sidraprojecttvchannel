import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function isAdmin(token: string): Promise<string | null> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data } = await supabaseAdmin
    .from('admin_assignments')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data ? user.id : null;
}

// GET /api/admin/comments?videoId=xxx&limit=50&offset=0
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const adminId = await isAdmin(auth.slice(7));
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const videoId = url.searchParams.get('videoId');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('premium_video_comments')
    .select(`
      id, content, likes, is_deleted, deleted_reason, created_at,
      premium_video_id,
      users:user_id (id, full_name, avatar_url),
      premium_videos:premium_video_id (title)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (videoId) query = query.eq('premium_video_id', videoId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

// DELETE /api/admin/comments  body: { commentId, reason?, sendWarning?, userId? }
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const adminId = await isAdmin(auth.slice(7));
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { commentId, reason, sendWarning, userId } = body;
  if (!commentId) return NextResponse.json({ error: 'commentId requis' }, { status: 400 });

  await supabaseAdmin
    .from('premium_video_comments')
    .update({ is_deleted: true, deleted_by: adminId, deleted_reason: reason || 'Supprimé par un administrateur' })
    .eq('id', commentId);

  // Optionally send a warning notification
  if (sendWarning && userId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'warning',
      title: '⚠️ Avertissement — Comportement inapproprié',
      message: reason
        ? `Un de vos commentaires a été supprimé : "${reason}". Merci de respecter les règles de la communauté.`
        : 'Un de vos commentaires a été supprimé car il ne respectait pas les règles de la communauté.',
      icon: '⚠️',
      link: null,
    });

    // Increment user warning count
    try {
      await supabaseAdmin.rpc('increment_warning_count', { p_user_id: userId });
    } catch {
      // RPC may not exist yet — silently fail
    }
  }

  return NextResponse.json({ success: true });
}
