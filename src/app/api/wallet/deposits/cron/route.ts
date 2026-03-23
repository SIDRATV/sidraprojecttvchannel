import { NextRequest, NextResponse } from 'next/server';
import { processPendingWithdrawals } from '@/lib/wallet';
import { walletConfig } from '@/lib/wallet/config';
import { runFullDepositScan, testAllRpcConnections } from '@/lib/wallet/deposit-scanner';
import { isScannerAvailable, triggerDepositScan, getScannerStatus } from '@/lib/wallet/scanner-client';

/**
 * GET /api/wallet/deposits/cron
 *
 * Vercel Cron endpoint — runs every minute.
 *
 * If RAILWAY_SCANNER_URL is configured and reachable, delegates scanning
 * to the Railway service. Otherwise falls back to local scanning.
 *
 * Protected by CRON_SECRET header or admin API key.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
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

  // Check if Railway scanner is available
  const railwayAvailable = await isScannerAvailable();

  if (railwayAvailable) {
    // ── Delegate to Railway scanner ──────────────────────────
    console.log('[cron] Railway scanner is available — delegating scan');
    results.mode = 'railway';

    try {
      const scannerStatus = await getScannerStatus();
      results.scanner_status = {
        scanner: scannerStatus.scanner,
        cycleCount: scannerStatus.cycleCount,
        uptime: scannerStatus.uptime,
        rpcHealth: scannerStatus.rpcHealth,
        lastScan: scannerStatus.lastScan,
      };
      console.log(`[cron] Railway scanner has run ${scannerStatus.cycleCount} cycles`);
    } catch (error: any) {
      console.error('[cron] Failed to fetch scanner status:', error?.message);
      results.scanner_status = { error: error?.message };
    }
  } else {
    // ── Fall back to local scanning ──────────────────────────
    console.log('[cron] Railway scanner not available — running local scan');
    results.mode = 'local';

    // Step 1: RPC health check
    try {
      const rpcHealth = await testAllRpcConnections();
      results.rpc_health = rpcHealth;

      const failedNetworks = rpcHealth.filter((r) => !r.connected);
      if (failedNetworks.length > 0) {
        console.error(
          `[cron] RPC CONNECTION FAILED for: ${failedNetworks.map((r) => r.network).join(', ')}`
        );
      }
    } catch (error: any) {
      console.error('[cron] RPC health check failed:', error?.message);
      results.rpc_health = { error: error?.message };
    }

    // Step 2: Scan all chains for deposits
    try {
      console.log('[cron] Starting blockchain deposit scan...');
      const depositScan = await runFullDepositScan({ maxBlocks: 20 });
      results.deposits = depositScan;
      console.log(
        `[cron] Deposit scan complete: credited=${depositScan.totalCredited} matches=${depositScan.totalMatches} errors=${depositScan.totalErrors} duration=${depositScan.durationMs}ms`
      );
    } catch (error: any) {
      console.error('[cron] Deposit scan failed:', error?.message);
      results.deposits = { error: error?.message || 'scan failed' };
    }

    // Step 3: Process pending withdrawals
    try {
      console.log('[cron] Processing pending withdrawals...');
      const withdrawalResult = await processPendingWithdrawals({ limit: 10 });
      results.withdrawals = withdrawalResult;
      console.log(
        `[cron] Withdrawals: processed=${withdrawalResult.processed} success=${withdrawalResult.success} failed=${withdrawalResult.failed}`
      );
    } catch (error: any) {
      console.error('[cron] Withdrawal processing failed:', error?.message);
      results.withdrawals = { error: error?.message || 'processing failed' };
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    ...results,
  });
}
