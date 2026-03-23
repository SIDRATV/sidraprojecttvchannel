/**
 * Railway Blockchain Scanner — Entry Point
 *
 * Starts:
 *   1. Express HTTP server (for Vercel API calls + health checks)
 *   2. Continuous scan loop (deposits + withdrawals every N seconds)
 *
 * On startup:
 *   - Tests RPC connectivity for all chains
 *   - Logs configuration summary
 *   - Starts the scan interval
 *
 * Resource-conscious:
 *   - Scan interval defaults to 15s (configurable via SCAN_INTERVAL_MS)
 *   - Only scans last 50 blocks per cycle (configurable)
 *   - GC-friendly: no retained state beyond lastScanResult
 */

import { config, getActiveChains } from './config';
import { logger } from './logger';
import { testAllRpcConnections, runFullDepositScan } from './scanner';
import { processPendingWithdrawals } from './withdrawals';
import {
  app,
  updateLastScanResult,
  setScannerRunning,
  incrementCycleCount,
} from './server';

// ─── Scan Loop ────────────────────────────────────────────────

let scanning = false;

async function runScanCycle() {
  if (scanning) {
    logger.warn('loop', 'Previous scan cycle still running — skipping this tick');
    return;
  }

  scanning = true;
  const cycleStart = Date.now();

  try {
    // Deposit scan
    const scanResult = await runFullDepositScan(config.maxBlocksPerScan);
    updateLastScanResult(scanResult);

    // Withdrawal processing
    if (config.processWithdrawals) {
      try {
        const wResult = await processPendingWithdrawals();
        if (wResult.processed > 0) {
          logger.info('loop', `Withdrawals: ${wResult.success} success, ${wResult.failed} failed out of ${wResult.processed}`);
        }
      } catch (wErr: any) {
        logger.error('loop', `Withdrawal processing error: ${wErr?.message}`);
      }
    }

    incrementCycleCount();

    const cycleDuration = Date.now() - cycleStart;
    if (scanResult.totalCredited > 0) {
      logger.info('loop', `Cycle done: ${scanResult.totalCredited} deposits credited in ${cycleDuration}ms`);
    }
  } catch (err: any) {
    logger.error('loop', `Scan cycle error: ${err?.message}`);
  } finally {
    scanning = false;
  }
}

// ─── Startup ──────────────────────────────────────────────────

async function main() {
  logger.info('main', '=== Sidra Blockchain Scanner starting ===');

  // ── Start HTTP server FIRST so /health responds immediately ──
  // Railway healthcheck starts as soon as the container is up.
  // The server must be listening before any async work begins.
  await new Promise<void>((resolve) => {
    app.listen(config.port, () => {
      logger.info('main', `HTTP server listening on port ${config.port}`);
      resolve();
    });
  });

  logger.info('main', `Scan interval: ${config.scanIntervalMs}ms`);
  logger.info('main', `Max blocks per scan: ${config.maxBlocksPerScan}`);
  logger.info('main', `Min confirmations: ${config.minConfirmations}`);
  logger.info('main', `Process withdrawals: ${config.processWithdrawals}`);
  logger.info('main', `Active chains: ${getActiveChains().join(', ')}`);

  // Validate required env vars after server is up
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SCANNER_API_KEY'].filter(
    (v) => !process.env[v]
  );
  if (missing.length > 0) {
    logger.error('main', `Missing required env vars: ${missing.join(', ')} — scanner will not run. Set them in Railway dashboard.`);
    // Don't exit — keep server alive so /health returns 'stopped' state
    return;
  }

  // Test RPC connectivity (non-blocking, just informational)
  testAllRpcConnections().then((rpcResults) => {
    for (const r of rpcResults) {
      if (r.connected) {
        logger.info('main', `✓ ${r.network}: connected, block ${r.latestBlock}, ${r.latencyMs}ms`);
      } else {
        logger.error('main', `✗ ${r.network}: RPC CONNECTION FAILED — ${r.error}`);
      }
    }
  }).catch(() => {});

  // Start scan loop
  setScannerRunning(true);
  logger.info('main', 'Starting scan loop...');

  // Delay first scan by 5s to let Railway healthcheck pass first
  setTimeout(async () => {
    await runScanCycle();
    setInterval(runScanCycle, config.scanIntervalMs);
    logger.info('main', '=== Scanner is running ===');
  }, 5_000);
}

// ─── Graceful shutdown ────────────────────────────────────────

process.on('SIGTERM', () => {
  logger.info('main', 'SIGTERM received — shutting down');
  setScannerRunning(false);
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('main', 'SIGINT received — shutting down');
  setScannerRunning(false);
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('main', `Unhandled rejection: ${reason}`);
});

// Run
main().catch((err) => {
  logger.error('main', `Fatal startup error: ${err?.message || err}`);
  process.exit(1);
});
