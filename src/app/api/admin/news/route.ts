import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/news — list all articles with like/comment counts
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: articles, error } = await (supabase as any)
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });

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

// POST /api/admin/news — create article
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, content, category, author, image_url, read_time, featured, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('news_articles')
      .insert({
        title,
        description: description || '',
        content,
        category: category || 'General',
        author: author || 'Rédaction Sidra',
        image_url: image_url || '',
        read_time: read_time || 3,
        featured: featured || false,
        status: status || 'published',
        published_at: status === 'draft' ? null : new Date().toISOString(),
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/news — update article
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { articleId, ...updates } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 });
    }

    const allowedFields = ['title', 'description', 'content', 'category', 'author', 'image_url', 'read_time', 'featured', 'status'];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    // If publishing a draft, set published_at
    if (safeUpdates.status === 'published') {
      const { data: existing } = await (supabase as any)
        .from('news_articles')
        .select('published_at')
        .eq('id', articleId)
        .single();
      if (existing && !existing.published_at) {
        safeUpdates.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await (supabase as any)
      .from('news_articles')
      .update(safeUpdates)
      .eq('id', articleId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/news — delete article
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('news_articles')
      .delete()
      .eq('id', articleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
