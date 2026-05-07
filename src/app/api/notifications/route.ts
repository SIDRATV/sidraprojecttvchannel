import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

// GET /api/notifications — fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwtPayload.sub, email: jwtPayload.email };

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    let query = (supabase as any)
      .from('notifications')
      .select('id, type, title, message, icon, link, read, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count: totalCount } = await query;
    if (error) throw error;

    // Unread count: if fetching all, count unread from result; else run lean query
    let unreadCount: number;
    if (!unreadOnly) {
      unreadCount = (data || []).filter((n: any) => !n.read).length;
      // If we hit the limit, a precise count requires a separate head query
      if ((data || []).length === limit) {
        const { count: exactUnread } = await (supabase as any)
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        unreadCount = exactUnread || 0;
      }
    } else {
      unreadCount = totalCount || 0;
    }

    return NextResponse.json({
      notifications: data || [],
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwtPayload.sub, email: jwtPayload.email };

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all as read
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    } else if (notificationIds?.length) {
      // Mark specific notifications as read
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
