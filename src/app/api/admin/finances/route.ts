import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * GET /api/admin/finances
 * Returns platform revenue stats from platform_subscriptions and wallet data.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'finances');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;

  // Total active subscriptions and revenue
  const [subscriptionRes, planBreakdownRes, monthlyRes, walletRes] = await Promise.all([
    // Overall totals — active subscriptions
    (supabase as any)
      .from('premium_subscriptions')
      .select('amount_paid, status, plan_id')
      .eq('status', 'active'),

    // Revenue by plan (all time)
    (supabase as any)
      .from('premium_subscriptions')
      .select('plan_id, amount_paid, status'),

    // Recent months activity
    (supabase as any)
      .from('premium_subscriptions')
      .select('amount_paid, plan_id, created_at, status')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),

    // Total platform wallet balances (sum of all user wallets)
    (supabase as any)
      .from('wallet_accounts')
      .select('balance, locked_balance, currency'),
  ]);

  const activeSubs = subscriptionRes.data ?? [];
  const allSubs = planBreakdownRes.data ?? [];
  const recentSubs = monthlyRes.data ?? [];
  const walletAccounts = walletRes.data ?? [];

  // Compute totals
  const totalActiveRevenue = activeSubs.reduce(
    (sum: number, s: any) => sum + (parseFloat(s.amount_paid) || 0),
    0,
  );
  const totalActiveSubscribers = activeSubs.length;

  // Revenue by plan
  const byPlan: Record<string, { count: number; revenue: number }> = {};
  for (const s of allSubs) {
    const planKey = s.plan_id ?? 'unknown';
    if (!byPlan[planKey]) byPlan[planKey] = { count: 0, revenue: 0 };
    byPlan[planKey].count += 1;
    if (s.status === 'active') byPlan[planKey].revenue += parseFloat(s.amount_paid) || 0;
  }

  // Monthly revenue (last 90 days grouped by month)
  const monthlyMap: Record<string, number> = {};
  for (const s of recentSubs) {
    if (s.status === 'cancelled' || s.status === 'fraud') continue;
    const month = s.created_at.slice(0, 7); // "YYYY-MM"
    monthlyMap[month] = (monthlyMap[month] ?? 0) + (parseFloat(s.amount_paid) || 0);
  }
  const monthlyRevenue = Object.entries(monthlyMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Platform wallet totals
  const totalPlatformBalance = walletAccounts.reduce(
    (sum: number, w: any) => sum + (parseFloat(w.balance) || 0),
    0,
  );
  const totalLockedBalance = walletAccounts.reduce(
    (sum: number, w: any) => sum + (parseFloat(w.locked_balance) || 0),
    0,
  );

  return NextResponse.json({
    totalActiveRevenue: totalActiveRevenue.toFixed(4),
    totalActiveSubscribers,
    byPlan,
    monthlyRevenue,
    totalPlatformBalance: totalPlatformBalance.toFixed(8),
    totalLockedBalance: totalLockedBalance.toFixed(8),
    currency: 'SIDRA',
  });
}
