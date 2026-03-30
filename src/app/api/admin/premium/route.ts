import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  getPlans,
  updatePlan,
  getDiscountCodes,
  createDiscountCode,
  deactivateDiscountCode,
  getPremiumStats,
  getFraudAlerts,
  resolveFraudAlert,
} from '@/lib/premium/service';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerClient();
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) throw new Error('Admin required');
  return user;
}

// GET /api/admin/premium — full admin premium dashboard data
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const supabase = createServerClient();

    const [plans, discountCodes, stats, unresolvedAlerts] = await Promise.all([
      getPlans(),
      getDiscountCodes(),
      getPremiumStats(),
      getFraudAlerts(false),
    ]);

    // Fetch active subscribers for admin management
    const { data: subscribers } = await (supabase as any)
      .from('premium_subscriptions')
      .select('id, user_id, plan_id, duration, status, amount_paid, starts_at, expires_at, cancelled_at, users:user_id(full_name, email)')
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ plans, discountCodes, stats, fraudAlerts: unresolvedAlerts, subscribers: subscribers || [] });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' || err.message === 'Invalid token' ? 401 : err.message === 'Admin required' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/admin/premium — admin actions
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_plan': {
        const { planId, updates } = body;
        if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });
        await updatePlan(planId, updates);
        return NextResponse.json({ success: true });
      }

      case 'create_discount': {
        const { code, discountPercent, maxUses, validUntil, planRestriction } = body;
        if (!code || !discountPercent || !maxUses || !validUntil) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (discountPercent < 1 || discountPercent > 100) {
          return NextResponse.json({ error: 'Discount must be 1-100%' }, { status: 400 });
        }
        const created = await createDiscountCode({
          code,
          discountPercent,
          maxUses,
          validUntil,
          planRestriction,
          createdBy: admin.id,
        });
        return NextResponse.json({ success: true, code: created });
      }

      case 'deactivate_discount': {
        const { codeId } = body;
        if (!codeId) return NextResponse.json({ error: 'codeId required' }, { status: 400 });
        await deactivateDiscountCode(codeId);
        return NextResponse.json({ success: true });
      }

      case 'resolve_fraud': {
        const { alertId, note } = body;
        if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 });
        await resolveFraudAlert(alertId, admin.id, note || '');
        return NextResponse.json({ success: true });
      }

      case 'cancel_subscription': {
        const { subscriptionId } = body;
        if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
        const supabase = createServerClient();

        // Get the subscription to find the user
        const { data: sub, error: subErr } = await (supabase as any)
          .from('premium_subscriptions')
          .select('id, user_id, status')
          .eq('id', subscriptionId)
          .single();

        if (subErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        if (sub.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 });

        // Cancel the subscription
        const { error: cancelErr } = await (supabase as any)
          .from('premium_subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', subscriptionId);

        if (cancelErr) throw cancelErr;

        // Clear user premium fields
        const { error: userErr } = await (supabase as any)
          .from('users')
          .update({ premium_plan: null, premium_expires_at: null, premium_subscription_id: null })
          .eq('id', sub.user_id);

        if (userErr) throw userErr;

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    const status = err.message === 'Unauthorized' || err.message === 'Invalid token' ? 401 : err.message === 'Admin required' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
