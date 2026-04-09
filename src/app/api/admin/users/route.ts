import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  // Auth check — admin only
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const ids = url.searchParams.get('ids') || '';
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100);

  let query = supabase
    .from('users')
    .select('id, username, email, full_name, avatar_url, is_admin, premium_plan, premium_expires_at, created_at, is_blocked, block_reason, blocked_at, warning_count, last_warning_at, last_warning_reason, deleted_at, deletion_requested_at, deletion_scheduled_at, deletion_reason')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    query = query.in('id', idList);
  } else if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}
