import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

// GET /api/referral — get current user's referral code, stats, referrals list, settings
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = { id: jwtPayload.sub, email: jwtPayload.email };

    const supabase = createServerClient();

    // Cast to any — new referral tables are not yet in the generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get or generate referral code (must be sequential — generate depends on existing)
    const { data: existing } = await db
      .from('referral_codes')
      .select('code, total_clicks')
      .eq('user_id', user.id)
      .maybeSingle();

    let code = existing?.code;
    if (!code) {
      const { data: generated } = await db.rpc('generate_referral_code', { p_user_id: user.id });
      code = generated;
    }

    // Run remaining queries in parallel
    const [referralsRes, rewardsRes, settingsRes] = await Promise.all([
      db.from('referrals')
        .select('id, status, created_at, activated_at, referred_id')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      db.from('referral_rewards')
        .select('amount, reason, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('referral_settings')
        .select('reward_per_subscription, reward_per_renewal, require_premium_to_earn, max_reward_per_referral')
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    const rawReferrals = referralsRes.data || [];
    const rewardsData = rewardsRes.data || [];
    const settings = settingsRes.data;

    // Manually fetch referred users from public.users (FK points to auth.users so
    // PostgREST cannot auto-resolve the join)
    let referrals = rawReferrals;
    if (rawReferrals.length > 0) {
      const referredIds = rawReferrals.map((r: any) => r.referred_id);
      const { data: referredUsers } = await db
        .from('users')
        .select('id, full_name, username, premium_plan')
        .in('id', referredIds);
      const usersMap: Record<string, any> = Object.fromEntries(
        (referredUsers || []).map((u: any) => [u.id, u])
      );
      referrals = rawReferrals.map((r: any) => ({
        ...r,
        referred: usersMap[r.referred_id] || null,
      }));
    }

    const totalRewards = rewardsData.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    return NextResponse.json({
      code,
      clicks: existing?.total_clicks || 0,
      referrals,
      rewards: rewardsData || [],
      totalRewards,
      settings: settings || {
        reward_per_subscription: 10,
        reward_per_renewal: 5,
        require_premium_to_earn: true,
        max_reward_per_referral: 500,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
