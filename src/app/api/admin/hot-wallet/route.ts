import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * GET /api/admin/hot-wallet
 * ?page=1&limit=50&user_id=&type=&status=
 * Returns all wallet transactions + hot wallet summary.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'finances');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const filterUserId = searchParams.get('user_id');
  const filterType = searchParams.get('type');
  const filterStatus = searchParams.get('status');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build transactions query
  let txQuery = (supabase as any)
    .from('wallet_transactions')
    .select(
      'id, type, direction, amount, fee, status, tx_hash, network, description, created_at, updated_at, user_id, currency, metadata',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filterUserId) txQuery = txQuery.eq('user_id', filterUserId);
  if (filterType) txQuery = txQuery.eq('type', filterType);
  if (filterStatus) txQuery = txQuery.eq('status', filterStatus);

  // Wallet summary
  const [txRes, summaryRes, topUsersRes] = await Promise.all([
    txQuery,

    // Total deposits/withdrawals/transfers
    (supabase as any)
      .from('wallet_transactions')
      .select('type, direction, amount, status'),

    // Top wallets by balance
    (supabase as any)
      .from('wallet_accounts')
      .select('user_id, balance, locked_balance, currency')
      .order('balance', { ascending: false })
      .limit(10),
  ]);

  const allTxs = summaryRes.data ?? [];
  const rawTxs = txRes.data ?? [];

  // Enrich transactions with user info
  const userIds = [...new Set(rawTxs.map((t: any) => t.user_id).filter(Boolean))] as string[];
  let usersMap: Record<string, { email: string; full_name: string; username: string }> = {};
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name, username')
      .in('id', userIds);
    if (usersData) {
      for (const u of usersData) {
        usersMap[u.id] = { email: u.email, full_name: u.full_name, username: u.username ?? '' };
      }
    }
  }

  const transactions = rawTxs.map((t: any) => ({
    ...t,
    users: usersMap[t.user_id] ?? null,
  }));

  const successfulDeposits = allTxs
    .filter((t: any) => t.type === 'deposit' && t.status === 'success')
    .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

  const successfulWithdrawals = allTxs
    .filter((t: any) => t.type === 'withdrawal' && t.status === 'success')
    .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

  const pendingCount = allTxs.filter((t: any) => t.status === 'pending').length;

  return NextResponse.json({
    transactions,
    total: txRes.count ?? 0,
    page,
    limit,
    summary: {
      totalDeposited: successfulDeposits.toFixed(8),
      totalWithdrawn: successfulWithdrawals.toFixed(8),
      pendingTransactions: pendingCount,
      netFlow: (successfulDeposits - successfulWithdrawals).toFixed(8),
    },
    topWallets: topUsersRes.data ?? [],
  });
}
