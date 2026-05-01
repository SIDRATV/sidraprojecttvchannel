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

    // Fetch active + recently expired subscribers for admin management
    const { data: rawSubs } = await (supabase as any)
      .from('premium_subscriptions')
      .select('id, user_id, plan_id, duration, status, amount_paid, starts_at, expires_at, cancelled_at')
      .in('status', ['active', 'expired'])
      .order('expires_at', { ascending: false })
      .limit(200);

    // Enrich with user data from public.users (FK is on auth.users so join doesn't work)
    let subscribers: any[] = [];
    if (rawSubs && rawSubs.length > 0) {
      const userIds = [...new Set(rawSubs.map((s: any) => s.user_id))];
      const { data: users } = await (supabase as any)
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));
      subscribers = rawSubs.map((s: any) => ({
        ...s,
        users: userMap.get(s.user_id) || null,
      }));
    }

    return NextResponse.json({ plans, discountCodes, stats, fraudAlerts: unresolvedAlerts, subscribers });
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

      case 'extend_subscription': {
        // Extend an existing subscription by N days
        const { subscriptionId, days } = body;
        if (!subscriptionId || !days || days <= 0) {
          return NextResponse.json({ error: 'subscriptionId and days (> 0) required' }, { status: 400 });
        }
        const supabase = createServerClient();

        const { data: sub, error: subErr } = await (supabase as any)
          .from('premium_subscriptions')
          .select('id, user_id, expires_at, status')
          .eq('id', subscriptionId)
          .single();

        if (subErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

        // Extend from current expiry (or now if expired)
        const baseDate = sub.expires_at && new Date(sub.expires_at) > new Date()
          ? new Date(sub.expires_at)
          : new Date();
        const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
        const newExpiryIso = newExpiry.toISOString();

        const { error: extErr } = await (supabase as any)
          .from('premium_subscriptions')
          .update({ expires_at: newExpiryIso, status: 'active' })
          .eq('id', subscriptionId);
        if (extErr) throw extErr;

        // Update user record
        const { error: userExtErr } = await (supabase as any)
          .from('users')
          .update({ premium_expires_at: newExpiryIso, premium_subscription_id: subscriptionId })
          .eq('id', sub.user_id);
        if (userExtErr) throw userExtErr;

        return NextResponse.json({ success: true, newExpiry: newExpiryIso });
      }

      case 'change_subscription_plan': {
        // Change the plan of an existing active subscription
        const { subscriptionId, newPlan } = body;
        if (!subscriptionId || !newPlan) {
          return NextResponse.json({ error: 'subscriptionId and newPlan required' }, { status: 400 });
        }
        if (!['pro', 'premium', 'vip'].includes(newPlan)) {
          return NextResponse.json({ error: 'newPlan must be pro, premium, or vip' }, { status: 400 });
        }
        const supabase = createServerClient();

        const { data: sub, error: subErr } = await (supabase as any)
          .from('premium_subscriptions')
          .select('id, user_id')
          .eq('id', subscriptionId)
          .single();

        if (subErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

        const { error: planErr } = await (supabase as any)
          .from('premium_subscriptions')
          .update({ plan_id: newPlan })
          .eq('id', subscriptionId);
        if (planErr) throw planErr;

        const { error: userPlanErr } = await (supabase as any)
          .from('users')
          .update({ premium_plan: newPlan })
          .eq('id', sub.user_id);
        if (userPlanErr) throw userPlanErr;

        return NextResponse.json({ success: true });
      }

      case 'assign_subscription': {
        // Manually assign a free subscription to a user (admin gift)
        const { userId, planId, days } = body;
        if (!userId || !planId || !days || days <= 0) {
          return NextResponse.json({ error: 'userId, planId and days (> 0) required' }, { status: 400 });
        }
        if (!['pro', 'premium', 'vip'].includes(planId)) {
          return NextResponse.json({ error: 'planId must be pro, premium, or vip' }, { status: 400 });
        }
        const supabase = createServerClient();

        // Verify target user exists
        const { data: targetUser, error: userFindErr } = await (supabase as any)
          .from('users')
          .select('id, full_name, email')
          .eq('id', userId)
          .single();
        if (userFindErr || !targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const now = new Date();
        const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

        // Cancel any existing active subscription
        await (supabase as any)
          .from('premium_subscriptions')
          .update({ status: 'cancelled', cancelled_at: now.toISOString() })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Create new subscription row (0 cost = admin gift)
        const { data: newSub, error: insertErr } = await (supabase as any)
          .from('premium_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            duration: 'monthly',
            status: 'active',
            amount_paid: 0,
            currency: 'SIDRA',
            payment_method: 'admin_gift',
            starts_at: now.toISOString(),
            expires_at: expiresAt,
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        // Update user premium fields
        const { error: userAssignErr } = await (supabase as any)
          .from('users')
          .update({
            premium_plan: planId,
            premium_expires_at: expiresAt,
            premium_subscription_id: newSub.id,
          })
          .eq('id', userId);
        if (userAssignErr) throw userAssignErr;

        return NextResponse.json({ success: true, subscriptionId: newSub.id, expiresAt });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    const status = err.message === 'Unauthorized' || err.message === 'Invalid token' ? 401 : err.message === 'Admin required' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
