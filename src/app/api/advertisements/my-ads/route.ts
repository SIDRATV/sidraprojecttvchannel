import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

// GET /api/advertisements/my-ads — get current user's advertisements
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = await verifyJwt(token);
    if (!jwt) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    const user = { id: jwt.sub };

    const { data: advertisements, error } = await (supabase as any)
      .from('advertisements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ advertisements: advertisements || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
