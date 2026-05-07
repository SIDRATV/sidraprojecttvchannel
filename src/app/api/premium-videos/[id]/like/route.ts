import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

export const dynamic = 'force-dynamic';

// POST /api/premium-videos/[id]/like — toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwt = await verifyJwt(token);
    if (!jwt) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwt.sub };

    // @ts-ignore - RPC function not in generated types
    const { data, error } = await (supabase as any).rpc('toggle_premium_video_like', {
      p_user_id: user.id,
      p_video_id: videoId,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('Premium video like error:', err);
    const message = err instanceof Error ? err.message : 'Failed to toggle like';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/premium-videos/[id]/like — check if user liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const supabase = createServerClient();

    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ liked: false });
    const jwt = await verifyJwt(token);
    if (!jwt) return NextResponse.json({ liked: false });
    const user = { id: jwt.sub };

    const { data } = await (supabase as any)
      .from('premium_video_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle();

    return NextResponse.json({ liked: !!data });
  } catch {
    return NextResponse.json({ liked: false });
  }
}
