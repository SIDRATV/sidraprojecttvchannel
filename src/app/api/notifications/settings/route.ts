import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

// PATCH /api/notifications/settings — update notifications_enabled
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwt = await verifyJwt(token);
    if (!jwt) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwt.sub };

    const body = await request.json();
    const enabled = Boolean(body.enabled);

    const { error } = await (supabase as any)
      .from('users')
      .update({ notifications_enabled: enabled })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notifications_enabled: enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
