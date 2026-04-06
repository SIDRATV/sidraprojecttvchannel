import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/news-articles — list published articles (or fetch comments for an article)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const fetchComments = searchParams.get('comments');

    // If requesting comments for a specific article
    if (articleId && fetchComments === 'true') {
      const { data: comments, error } = await (supabase as any)
        .from('news_article_comments')
        .select('id, content, user_id, created_at')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names
      const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, username, full_name')
          .in('id', userIds);
        if (users) {
          for (const u of users) {
            userMap[u.id] = u.full_name || u.username || 'Utilisateur';
          }
        }
      }

      return NextResponse.json({
        comments: (comments || []).map((c: any) => ({
          ...c,
          author_name: userMap[c.user_id] || 'Utilisateur',
          avatar_url: '',
        })),
      });
    }

    // Default: list published articles
    const { data: articles, error } = await (supabase as any)
      .from('news_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    // Get like + comment counts
    const articleIds = (articles || []).map((a: any) => a.id);
    let likeCounts: Record<string, number> = {};
    let commentCounts: Record<string, number> = {};

    if (articleIds.length > 0) {
      const { data: likes } = await (supabase as any)
        .from('news_article_likes')
        .select('article_id')
        .in('article_id', articleIds);

      if (likes) {
        for (const l of likes) {
          likeCounts[l.article_id] = (likeCounts[l.article_id] || 0) + 1;
        }
      }

      const { data: comms } = await (supabase as any)
        .from('news_article_comments')
        .select('article_id')
        .in('article_id', articleIds);

      if (comms) {
        for (const c of comms) {
          commentCounts[c.article_id] = (commentCounts[c.article_id] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      articles: (articles || []).map((a: any) => ({
        ...a,
        likes_count: likeCounts[a.id] || 0,
        comments_count: commentCounts[a.id] || 0,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/news-articles — authenticated: like or comment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { action, articleId, content } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 });
    }

    // Verify article exists
    const { data: article } = await (supabase as any)
      .from('news_articles')
      .select('id')
      .eq('id', articleId)
      .eq('status', 'published')
      .single();

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (action === 'like') {
      // Toggle like
      const { data: existing } = await (supabase as any)
        .from('news_article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await (supabase as any)
          .from('news_article_likes')
          .delete()
          .eq('id', existing.id);
        return NextResponse.json({ success: true, action: 'unliked' });
      } else {
        await (supabase as any)
          .from('news_article_likes')
          .insert({ article_id: articleId, user_id: user.id });
        return NextResponse.json({ success: true, action: 'liked' });
      }
    }

    if (action === 'comment') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Comment content required' }, { status: 400 });
      }
      if (content.trim().length > 2000) {
        return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
      }

      const { error: insertError } = await (supabase as any)
        .from('news_article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: content.trim(),
        });

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, action: 'commented' });
    }

    return NextResponse.json({ error: 'Invalid action (like|comment)' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
