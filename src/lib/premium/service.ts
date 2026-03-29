import { createServerClient } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────
export interface PremiumPlanRow {
  id: string;
  name: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  duration: string;
  status: string;
  amount_paid: number;
  currency: string;
  payment_method: string;
  discount_code: string | null;
  discount_amount: number;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export interface DiscountCodeRow {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  plan_restriction: string | null;
  is_active: boolean;
  created_at: string;
}

export type Duration = 'monthly' | 'quarterly' | 'yearly';

// ─── Plans ───────────────────────────────────────────────────
export async function getPlans(): Promise<PremiumPlanRow[]> {
  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('premium_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data || []) as PremiumPlanRow[];
}

export async function updatePlan(
  planId: string,
  updates: Partial<Pick<PremiumPlanRow, 'price_monthly' | 'price_quarterly' | 'price_yearly' | 'features' | 'is_active' | 'name'>>
): Promise<void> {
  const supabase = createServerClient();
  await (supabase as any)
    .from('premium_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId);
}

// ─── Subscription ────────────────────────────────────────────
export async function getUserActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SubscriptionRow | null;
}

export async function subscribe(input: {
  userId: string;
  planId: string;
  duration: Duration;
  discountCode?: string;
}): Promise<{ subscriptionId: string; amountPaid: number; expiresAt: string }> {
  const supabase = createServerClient();

  // 1. Get plan pricing
  const { data: plan } = await (supabase as any)
    .from('premium_plans')
    .select('*')
    .eq('id', input.planId)
    .eq('is_active', true)
    .single();

  if (!plan) throw new Error('Plan not found or inactive');

  // 2. Calculate price
  const priceKey = `price_${input.duration}` as keyof PremiumPlanRow;
  let price = Number(plan[priceKey]) || 0;
  if (price <= 0) throw new Error('Invalid plan pricing');

  // 3. Validate & apply discount
  let discountAmount = 0;
  let discountCodeId: string | null = null;

  if (input.discountCode) {
    const { data: code } = await (supabase as any)
      .from('premium_discount_codes')
      .select('*')
      .eq('code', input.discountCode.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (!code) throw new Error('Invalid discount code');
    if (new Date(code.valid_until) < new Date()) throw new Error('Discount code expired');
    if (code.used_count >= code.max_uses) throw new Error('Discount code fully redeemed');
    if (code.plan_restriction && code.plan_restriction !== input.planId) {
      throw new Error(`This code is only valid for the ${code.plan_restriction} plan`);
    }

    // Check if user already used this code
    const { data: existingUse } = await (supabase as any)
      .from('premium_discount_usage')
      .select('id')
      .eq('code_id', code.id)
      .eq('user_id', input.userId)
      .maybeSingle();

    if (existingUse) throw new Error('You have already used this discount code');

    discountAmount = Number(((price * code.discount_percent) / 100).toFixed(4));
    discountCodeId = code.id;
    price = Math.max(0, price - discountAmount);
  }

  // 4. Fraud check — rapid subscriptions
  const { data: recentSubs } = await (supabase as any)
    .from('premium_subscriptions')
    .select('id, created_at')
    .eq('user_id', input.userId)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (recentSubs && recentSubs.length >= 3) {
    await (supabase as any).from('premium_fraud_alerts').insert({
      user_id: input.userId,
      alert_type: 'rapid_cancel',
      severity: 'high',
      details: { recent_subs: recentSubs.length, attempted_plan: input.planId },
    });
    throw new Error('Too many subscription attempts. Please try again later.');
  }

  // 5. Atomic: deduct balance + create subscription via DB function
  const { data: subId, error: rpcError } = await (supabase as any)
    .rpc('premium_subscribe', {
      p_user_id: input.userId,
      p_plan_id: input.planId,
      p_duration: input.duration,
      p_amount: price,
      p_discount_code: input.discountCode || null,
      p_discount_amount: discountAmount,
    });

  if (rpcError) {
    // Detect balance manipulation
    if (rpcError.message?.includes('Insufficient')) {
      throw new Error(rpcError.message);
    }
    throw new Error(rpcError.message || 'Subscription failed');
  }

  // 6. Update discount code usage
  if (discountCodeId) {
    await (supabase as any)
      .from('premium_discount_codes')
      .update({ used_count: (await (supabase as any).from('premium_discount_codes').select('used_count').eq('id', discountCodeId).single()).data?.used_count + 1 })
      .eq('id', discountCodeId);

    await (supabase as any).from('premium_discount_usage').insert({
      code_id: discountCodeId,
      user_id: input.userId,
      subscription_id: subId,
    });
  }

  // 7. Get expiration from the subscription row
  const { data: sub } = await (supabase as any)
    .from('premium_subscriptions')
    .select('expires_at')
    .eq('id', subId)
    .single();

  // 8. Audit log
  await (supabase as any).from('wallet_audit_logs').insert({
    actor_user_id: input.userId,
    action: 'premium.subscribed',
    target_id: subId,
    details: {
      plan: input.planId,
      duration: input.duration,
      amount: price,
      discount: discountAmount,
      discount_code: input.discountCode || null,
    },
  });

  return {
    subscriptionId: subId,
    amountPaid: price,
    expiresAt: sub?.expires_at || '',
  };
}

// ─── Discount Codes (Admin) ─────────────────────────────────
export async function getDiscountCodes(): Promise<DiscountCodeRow[]> {
  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('premium_discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as DiscountCodeRow[];
}

export async function createDiscountCode(input: {
  code: string;
  discountPercent: number;
  maxUses: number;
  validUntil: string;
  planRestriction?: string;
  createdBy: string;
}): Promise<DiscountCodeRow> {
  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from('premium_discount_codes')
    .insert({
      code: input.code.toUpperCase().trim(),
      discount_percent: input.discountPercent,
      max_uses: input.maxUses,
      valid_until: input.validUntil,
      plan_restriction: input.planRestriction || null,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DiscountCodeRow;
}

export async function deactivateDiscountCode(codeId: string): Promise<void> {
  const supabase = createServerClient();
  await (supabase as any)
    .from('premium_discount_codes')
    .update({ is_active: false })
    .eq('id', codeId);
}

// ─── Validate discount code (public) ────────────────────────
export async function validateDiscountCode(code: string, planId?: string): Promise<{
  valid: boolean;
  discountPercent: number;
  message: string;
}> {
  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('premium_discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (!data) return { valid: false, discountPercent: 0, message: 'Code invalide' };
  if (new Date(data.valid_until) < new Date()) return { valid: false, discountPercent: 0, message: 'Code expiré' };
  if (data.used_count >= data.max_uses) return { valid: false, discountPercent: 0, message: 'Code épuisé' };
  if (data.plan_restriction && planId && data.plan_restriction !== planId) {
    return { valid: false, discountPercent: 0, message: `Code valide uniquement pour le plan ${data.plan_restriction}` };
  }

  return { valid: true, discountPercent: data.discount_percent, message: `-${data.discount_percent}% appliqué` };
}

// ─── Fraud alerts (Admin) ────────────────────────────────────
export async function getFraudAlerts(resolved?: boolean): Promise<any[]> {
  const supabase = createServerClient();
  let query = (supabase as any).from('premium_fraud_alerts').select('*, users:user_id(full_name, email, username)');
  if (resolved !== undefined) query = query.eq('resolved', resolved);
  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

export async function resolveFraudAlert(alertId: string, resolvedBy: string, note: string): Promise<void> {
  const supabase = createServerClient();
  await (supabase as any)
    .from('premium_fraud_alerts')
    .update({ resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString(), resolution_note: note })
    .eq('id', alertId);
}

// ─── Stats (Admin) ───────────────────────────────────────────
export async function getPremiumStats(): Promise<{
  totalActive: number;
  totalRevenue: number;
  byPlan: Record<string, { count: number; revenue: number }>;
  recentSubs: any[];
}> {
  const supabase = createServerClient();

  const { data: activeSubs } = await (supabase as any)
    .from('premium_subscriptions')
    .select('plan_id, amount_paid, created_at, users:user_id(full_name, email)')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const subs = activeSubs || [];
  const byPlan: Record<string, { count: number; revenue: number }> = {};
  let totalRevenue = 0;

  for (const s of subs) {
    if (!byPlan[s.plan_id]) byPlan[s.plan_id] = { count: 0, revenue: 0 };
    byPlan[s.plan_id].count++;
    byPlan[s.plan_id].revenue += Number(s.amount_paid);
    totalRevenue += Number(s.amount_paid);
  }

  return {
    totalActive: subs.length,
    totalRevenue,
    byPlan,
    recentSubs: subs.slice(0, 10),
  };
}

// ─── Subscription history for user ──────────────────────────
export async function getUserSubscriptionHistory(userId: string): Promise<SubscriptionRow[]> {
  const supabase = createServerClient();
  const { data } = await (supabase as any)
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data || []) as SubscriptionRow[];
}
