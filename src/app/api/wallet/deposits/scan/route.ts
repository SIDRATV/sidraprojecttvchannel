import { NextRequest, NextResponse } from 'next/server';
import { walletConfig } from '@/lib/wallet/config';
import { scanSidraDeposits, scanBscDeposits, type ScanResult } from '@/lib/wallet/deposit-scanner';
import type { WalletNetwork } from '@/lib/wallet/types';

/**
 * POST /api/wallet/deposits/scan
 *
 * Manually trigger a deposit scan for a specific network or all networks.
 * Can be called from an external cron service (e.g., cron-job.org, UptimeRobot)
 * every 10 seconds for near-real-time deposit detection.
 *
 * Body: { network?: "sidra" | "bsc", maxBlocks?: number }
 * Auth: x-admin-api-key header or CRON_SECRET bearer token
 */
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-api-key');
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  const validAdminKey = walletConfig.adminApiKey;
  const validCronSecret = process.env.CRON_SECRET;

  const isAuthorized =
    (validAdminKey && adminKey === validAdminKey) ||
    (validCronSecret && cronSecret === validCronSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const requestedNetwork = String(body?.network || '').toLowerCase();
    const maxBlocks = Number(body?.maxBlocks) || 500; // Default to last 500 blocks (~20+ min)

    const results: ScanResult[] = [];

    if (requestedNetwork === 'sidra' || !requestedNetwork) {
      const sidraResult = await scanSidraDeposits({ maxBlocks });
      results.push(sidraResult);
    }

    if (requestedNetwork === 'bsc' || !requestedNetwork) {
      try {
        const bscResult = await scanBscDeposits({ maxBlocks });
        results.push(bscResult);
      } catch (err: any) {
        // BSC scan failure shouldn't block Sidra results
        console.error('[scan] BSC scan error:', err?.message);
        results.push({
          network: 'bsc' as WalletNetwork,
          scannedBlocks: 0,
          fromBlock: 0,
          toBlock: 0,
          matches: 0,
          credited: 0,
          pendingConfirmations: 0,
          errors: 1,
          durationMs: 0,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      results,
      totalCredited: results.reduce((s, r) => s + r.credited, 0),
      totalMatches: results.reduce((s, r) => s + r.matches, 0),
    });
  } catch (error: any) {
    console.error('[scan] Deposit scan failed:', error?.message);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Scan failed', durationMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
