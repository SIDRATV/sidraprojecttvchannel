import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getPlans, getUserActiveSubscription, subscribe, validateDiscountCode } from '@/lib/premium/service';

// GET /api/premium/subscribe — get plans + user status + balance
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

    const [plans, activeSub, balanceResult] = await Promise.all([
      getPlans(),
      getUserActiveSubscription(user.id),
      (supabase as any).from('wallet_accounts').select('balance, currency').eq('user_id', user.id).maybeSingle(),
    ]);

    return NextResponse.json({
      plans,
      activeSubscription: activeSub,
      wallet: {
        balance: Number(balanceResult?.data?.balance || 0),
        currency: balanceResult?.data?.currency || 'SIDRA',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/premium/subscribe — subscribe to a plan
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
    const { planId, duration, discountCode } = body;

    if (!planId || !duration) {
      return NextResponse.json({ error: 'planId and duration required' }, { status: 400 });
    }
    if (!['monthly', 'quarterly', 'yearly'].includes(duration)) {
      return NextResponse.json({ error: 'duration must be monthly, quarterly, or yearly' }, { status: 400 });
    }
    if (!['pro', 'premium', 'vip'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const result = await subscribe({
      userId: user.id,
      planId,
      duration,
      discountCode: discountCode || undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message?.includes('Insufficient') ? 402 : 400;
    return NextResponse.json({ error: err.message || 'Subscription failed' }, { status });
  }
}
