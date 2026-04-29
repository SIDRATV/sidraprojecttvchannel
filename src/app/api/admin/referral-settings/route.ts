import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/referral-settings
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('referral_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/referral-settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reward_per_subscription,
      reward_per_renewal,
      require_premium_to_earn,
      max_reward_per_referral,
      is_active,
    } = body;

    const supabase = createServerClient();

    // Get existing row id
    const { data: existing } = await supabase
      .from('referral_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('referral_settings')
        .update({
          reward_per_subscription: Number(reward_per_subscription),
          reward_per_renewal: Number(reward_per_renewal),
          require_premium_to_earn: Boolean(require_premium_to_earn),
          max_reward_per_referral: Number(max_reward_per_referral),
          is_active: Boolean(is_active),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('referral_settings').insert({
        reward_per_subscription: Number(reward_per_subscription),
        reward_per_renewal: Number(reward_per_renewal),
        require_premium_to_earn: Boolean(require_premium_to_earn),
        max_reward_per_referral: Number(max_reward_per_referral),
        is_active: Boolean(is_active),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
