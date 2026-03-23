/**
 * Express API for the Railway scanner.
 *
 * Exposes endpoints for the Vercel frontend to:
 *   - Check scanner health / RPC status
 *   - Trigger manual deposit scans
 *   - Fetch deposit scan results
 *   - Trigger withdrawal processing
 *
 * All endpoints are protected by SCANNER_API_KEY in the x-api-key header.
 */

import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import {
  runFullDepositScan,
  scanSidraDeposits,
  scanBscDeposits,
  testAllRpcConnections,
  type FullScanResult,
} from './scanner';
import { processPendingWithdrawals } from './withdrawals';
import { logger } from './logger';

export const app = express();
app.use(express.json());

// ─── Auth middleware ──────────────────────────────────────────

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string | undefined;
  if (!key || key !== config.scannerApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ─── Scanner state (shared with the scan loop) ───────────────

let lastScanResult: FullScanResult | null = null;
let scannerRunning = false;
let cycleCount = 0;
const startedAt = new Date().toISOString();

export function updateLastScanResult(result: FullScanResult) {
  lastScanResult = result;
}

export function setScannerRunning(running: boolean) {
  scannerRunning = running;
}

export function incrementCycleCount() {
  cycleCount++;
}

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /health
 * Public health check (no auth required).
 */
app.get('/health', (_req: Request, res: Response) => {
  const configMissing = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SCANNER_API_KEY;
  res.status(200).json({
    status: configMissing ? 'misconfigured' : 'ok',
    scanner: scannerRunning ? 'running' : 'stopped',
    configMissing,
    startedAt,
    cycleCount,
    uptime: process.uptime(),
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

/**
 * GET /api/status
 * Full status including last scan result and RPC health. Auth required.
 */
app.get('/api/status', requireApiKey, async (_req: Request, res: Response) => {
  try {
    const rpcHealth = await testAllRpcConnections();
    res.json({
      ok: true,
      scanner: scannerRunning ? 'running' : 'stopped',
      startedAt,
      cycleCount,
      uptime: process.uptime(),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      rpcHealth,
      lastScan: lastScanResult,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

/**
 * GET /api/rpc-health
 * Test RPC connections for all chains.
 */
app.get('/api/rpc-health', requireApiKey, async (_req: Request, res: Response) => {
  try {
    const results = await testAllRpcConnections();
    const allConnected = results.every((r) => r.connected);
    res.json({ ok: allConnected, networks: results, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

/**
 * POST /api/scan
 * Trigger a deposit scan. Body: { network?: "sidra"|"bsc", maxBlocks?: number }
 */
app.post('/api/scan', requireApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const network = String(req.body?.network || '').toLowerCase();
    const maxBlocks = Number(req.body?.maxBlocks) || undefined;

    let result;
    if (network === 'sidra') {
      result = { networks: [await scanSidraDeposits(maxBlocks)] } as any;
    } else if (network === 'bsc') {
      result = { networks: [await scanBscDeposits(maxBlocks)] } as any;
    } else {
      result = await runFullDepositScan(maxBlocks);
    }

    res.json({
      ok: true,
      durationMs: Date.now() - startTime,
      ...result,
    });
  } catch (err: any) {
    logger.error('api', `Scan endpoint error: ${err?.message}`);
    res.status(500).json({ ok: false, error: err?.message, durationMs: Date.now() - startTime });
  }
});

/**
 * GET /api/last-scan
 * Returns the result of the most recent automatic scan cycle.
 */
app.get('/api/last-scan', requireApiKey, (_req: Request, res: Response) => {
  if (!lastScanResult) {
    res.json({ ok: true, message: 'No scan has completed yet', lastScan: null });
    return;
  }
  res.json({ ok: true, lastScan: lastScanResult });
});

/**
 * POST /api/process-withdrawals
 * Trigger withdrawal processing.
 */
app.post('/api/process-withdrawals', requireApiKey, async (_req: Request, res: Response) => {
  if (!config.processWithdrawals) {
    res.status(400).json({ ok: false, error: 'Withdrawal processing is disabled' });
    return;
  }

  try {
    const result = await processPendingWithdrawals();
    res.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error('api', `Withdrawal endpoint error: ${err?.message}`);
    res.status(500).json({ ok: false, error: err?.message });
  }
});
