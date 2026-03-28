import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * GET /api/admin/security
 * ?page=1&limit=50&severity=&resolved=&type=
 *
 * POST /api/admin/security
 * { action: 'resolve', event_id, note? }
 * { action: 'alert', type, severity, title, description, metadata? }
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'security');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const severity = searchParams.get('severity');
  const resolved = searchParams.get('resolved');
  const type = searchParams.get('type');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = (supabase as any)
    .from('security_events')
    .select(
      'id, type, severity, title, description, user_id, ip_address, metadata, resolved, resolved_at, resolved_by, created_at, users(email, full_name, username)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (severity) query = query.eq('severity', severity);
  if (type) query = query.eq('type', type);
  if (resolved !== null && resolved !== undefined && resolved !== '') {
    query = query.eq('resolved', resolved === 'true');
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary stats
  const { data: summary } = await (supabase as any)
    .from('security_events')
    .select('severity, resolved');

  const unresolved = (summary ?? []).filter((e: any) => !e.resolved);
  const criticalCount = unresolved.filter((e: any) => e.severity === 'critical').length;
  const highCount = unresolved.filter((e: any) => e.severity === 'high').length;
  const mediumCount = unresolved.filter((e: any) => e.severity === 'medium').length;

  return NextResponse.json({
    events: data ?? [],
    total: count ?? 0,
    page,
    limit,
    summary: {
      totalUnresolved: unresolved.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'security');
  if (!auth.ok) return auth.response;

  const { admin, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;

  if (action === 'resolve') {
    const { event_id, note } = body as { event_id?: string; note?: string };
    if (!event_id) return NextResponse.json({ error: 'event_id requis' }, { status: 400 });

    const { error } = await (supabase as any)
      .from('security_events')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: admin.id,
        metadata: note ? { resolution_note: note } : undefined,
      })
      .eq('id', event_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'alert') {
    const { type, severity, title, description, metadata, user_id, ip_address } = body as Record<string, string | undefined>;

    if (!type || !severity || !title) {
      return NextResponse.json({ error: 'type, severity, title requis' }, { status: 400 });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ error: 'severity invalide' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('security_events')
      .insert([{
        type,
        severity,
        title,
        description: description ?? null,
        user_id: user_id ?? null,
        ip_address: ip_address ?? null,
        metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : null,
        resolved: false,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data }, { status: 201 });
  }

  return NextResponse.json({ error: 'Action invalide. Actions: resolve, alert' }, { status: 400 });
}
