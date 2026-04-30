import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/referral — get current user's referral code, stats, referrals list, settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Cast to any — new referral tables are not yet in the generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get or generate referral code
    const { data: existing } = await db
      .from('referral_codes')
      .select('code, total_clicks, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    let code = existing?.code;
    if (!code) {
      // Generate via DB function
      const { data: generated } = await db.rpc('generate_referral_code', { p_user_id: user.id });
      code = generated;
    }

    // Get referrals with referred user info
    const { data: referrals } = await db
      .from('referrals')
      .select(`
        id, status, created_at, activated_at,
        referred:referred_id (full_name, username, premium_plan)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    // Get total rewards earned
    const { data: rewardsData } = await db
      .from('referral_rewards')
      .select('amount, reason, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    const totalRewards = (rewardsData || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    // Get settings (rules)
    const { data: settings } = await db
      .from('referral_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({
      code,
      clicks: existing?.total_clicks || 0,
      referrals: referrals || [],
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
