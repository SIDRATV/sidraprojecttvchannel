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

  // Fetch stats in parallel
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: totalCategories },
    { count: totalPremiumVideos },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    (supabase as any)
      .from('premium_videos')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id, full_name, email, created_at, is_admin')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    newUsersWeek: newUsersWeek ?? 0,
    totalCategories: totalCategories ?? 0,
    totalPremiumVideos: totalPremiumVideos ?? 0,
    recentUsers: recentUsers ?? [],
  });
}
