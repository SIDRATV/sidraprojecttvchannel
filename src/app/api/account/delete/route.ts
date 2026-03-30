import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/account/delete — request or cancel account deletion
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action === 'request') {
      const { data, error } = await (supabase as any).rpc('request_account_deletion', {
        p_user_id: user.id,
        p_reason: reason || null,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, ...data });
    }

    if (action === 'cancel') {
      const { data, error } = await (supabase as any).rpc('cancel_account_deletion', {
        p_user_id: user.id,
        p_admin_override: false,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, cancelled: true });
    }

    return NextResponse.json({ error: 'Action invalide. Utilisez "request" ou "cancel".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// GET /api/account/delete — check deletion status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('users')
      .select('deletion_requested_at, deletion_scheduled_at, deletion_reason')
      .eq('id', user.id)
      .single();

    if (!profile?.deletion_requested_at) {
      return NextResponse.json({ pending: false });
    }

    const requestedAt = new Date(profile.deletion_requested_at);
    const scheduledAt = new Date(profile.deletion_scheduled_at);
    const cancelDeadline = new Date(requestedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
    const now = new Date();

    return NextResponse.json({
      pending: true,
      requestedAt: profile.deletion_requested_at,
      scheduledAt: profile.deletion_scheduled_at,
      reason: profile.deletion_reason,
      canCancel: now < cancelDeadline,
      cancelDeadline: cancelDeadline.toISOString(),
      daysRemaining: Math.max(0, Math.ceil((scheduledAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
