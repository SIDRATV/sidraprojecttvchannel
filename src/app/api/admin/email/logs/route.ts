import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// GET — Email logs with pagination and stats
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const status = searchParams.get('status'); // sent | delivered | failed | bounced
  const statsOnly = searchParams.get('stats') === 'true';

  if (statsOnly) {
    // Return aggregate stats
    const [totalRes, sentRes, failedRes, todayRes] = await Promise.all([
      auth.supabase.from('email_logs').select('id', { count: 'exact', head: true }),
      auth.supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      auth.supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      auth.supabase.from('email_logs').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    return NextResponse.json({
      total: totalRes.count || 0,
      sent: sentRes.count || 0,
      failed: failedRes.count || 0,
      today: todayRes.count || 0,
    });
  }

  // Paginated logs
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from('email_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  return NextResponse.json({
    logs: data,
    total: count || 0,
    page,
    limit,
    pages: Math.ceil((count || 0) / limit),
  });
}
