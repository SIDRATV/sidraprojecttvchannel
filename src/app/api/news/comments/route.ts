import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/news/comments?articleId=xxx — get comments for an article
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 });
    }

    const { data: comments, error } = await (supabase as any)
      .from('news_article_comments')
      .select('id, content, user_id, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user info for comments
    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
    let userMap: Record<string, { username: string; avatar_url: string }> = {};

    if (userIds.length > 0) {
      const { data: users } = await (supabase as any)
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (users) {
        for (const u of users) {
          userMap[u.id] = { username: u.username || 'Utilisateur', avatar_url: u.avatar_url || '' };
        }
      }
    }

    return NextResponse.json({
      comments: (comments || []).map((c: any) => ({
        ...c,
        author: userMap[c.user_id]?.username || 'Utilisateur',
        avatar_url: userMap[c.user_id]?.avatar_url || '',
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
