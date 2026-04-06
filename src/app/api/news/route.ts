import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/news — public: list published articles with stats
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: articles, error } = await (supabase as any)
      .from('news_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

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

      const { data: comments } = await (supabase as any)
        .from('news_article_comments')
        .select('article_id')
        .in('article_id', articleIds);

      if (comments) {
        for (const c of comments) {
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

// POST /api/news — authenticated user actions: like, comment
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
      const { data: existingLike } = await (supabase as any)
        .from('news_article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await (supabase as any)
          .from('news_article_likes')
          .delete()
          .eq('id', existingLike.id);
        return NextResponse.json({ success: true, action: 'unliked' });
      } else {
        await (supabase as any)
          .from('news_article_likes')
          .insert({ article_id: articleId, user_id: user.id });
        return NextResponse.json({ success: true, action: 'liked' });
      }
    } else if (action === 'comment') {
      if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Comment content required' }, { status: 400 });
      }

      const { data: comment, error: insertError } = await (supabase as any)
        .from('news_article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, comment });
    } else {
      return NextResponse.json({ error: 'action must be "like" or "comment"' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
