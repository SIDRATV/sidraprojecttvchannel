import { NextRequest, NextResponse } from 'next/server';
import { syncDeposits, processPendingWithdrawals } from '@/lib/wallet';
import { walletConfig } from '@/lib/wallet/config';
import type { WalletNetwork } from '@/lib/wallet/types';

/**
 * GET /api/wallet/deposits/cron
 *
 * Vercel Cron endpoint (called every minute or on your configured schedule).
 * 1. Scans blockchain for new deposits on each supported network
 * 2. Processes pending/failed withdrawals
 *
 * Protected by CRON_SECRET header or admin API key.
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  const adminKey = request.headers.get('x-admin-api-key');

  const validCronSecret = process.env.CRON_SECRET;
  const validAdminKey = walletConfig.adminApiKey;

  const isAuthorized =
    (validCronSecret && cronSecret === validCronSecret) ||
    (validAdminKey && adminKey === validAdminKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Sync deposits on each configured network
  const networks: WalletNetwork[] = ['sidra'];

  // Only add BSC if RPC URL is configured
  if (walletConfig.rpcUrls.bsc) {
    networks.push('bsc');
  }

  for (const network of networks) {
    try {
      console.log(`[cron] Starting deposit sync for ${network}...`);
      const syncResult = await syncDeposits({ network });
      results[`deposits_${network}`] = syncResult;
      console.log(`[cron] Deposit sync ${network}: credited=${syncResult.credited} matches=${syncResult.matches} blocks=${syncResult.scannedBlocks}`);
    } catch (error: any) {
      console.error(`[cron] Deposit sync failed for ${network}:`, error?.message);
      results[`deposits_${network}`] = { error: error?.message || 'sync failed' };
    }
  }

  // Process pending withdrawals
  try {
    console.log('[cron] Processing pending withdrawals...');
    const withdrawalResult = await processPendingWithdrawals({ limit: 10 });
    results.withdrawals = withdrawalResult;
    console.log(`[cron] Withdrawals: processed=${withdrawalResult.processed} success=${withdrawalResult.success} failed=${withdrawalResult.failed}`);
  } catch (error: any) {
    console.error('[cron] Withdrawal processing failed:', error?.message);
    results.withdrawals = { error: error?.message || 'processing failed' };
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
