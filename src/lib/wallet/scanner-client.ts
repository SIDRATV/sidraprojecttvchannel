/**
 * Railway Scanner API Client
 *
 * Used by the Vercel backend to communicate with the Railway scanner service.
 * Falls back gracefully if the scanner is not configured.
 */

const SCANNER_URL = process.env.RAILWAY_SCANNER_URL || '';
const SCANNER_API_KEY = process.env.SCANNER_API_KEY || '';

function isConfigured(): boolean {
  return !!(SCANNER_URL && SCANNER_API_KEY);
}

async function callScanner<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!isConfigured()) {
    throw new Error('Railway scanner not configured (RAILWAY_SCANNER_URL / SCANNER_API_KEY)');
  }

  const url = `${SCANNER_URL.replace(/\/$/, '')}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SCANNER_API_KEY,
    },
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Scanner API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Check if the Railway scanner is configured and reachable.
 */
export async function isScannerAvailable(): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${SCANNER_URL.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get the scanner's full status including RPC health and last scan result.
 */
export async function getScannerStatus() {
  return callScanner<{
    ok: boolean;
    scanner: string;
    startedAt: string;
    cycleCount: number;
    uptime: number;
    memoryMb: number;
    rpcHealth: Array<{
      network: string;
      connected: boolean;
      latestBlock?: number;
      latencyMs?: number;
      error?: string;
    }>;
    lastScan: {
      timestamp: string;
      networks: Array<{
        network: string;
        scannedBlocks: number;
        matches: number;
        credited: number;
        errors: number;
      }>;
      totalCredited: number;
      totalMatches: number;
    } | null;
  }>('/api/status');
}

/**
 * Get RPC health for all configured chains.
 */
export async function getScannerRpcHealth() {
  return callScanner<{
    ok: boolean;
    networks: Array<{
      network: string;
      connected: boolean;
      latestBlock?: number;
      latencyMs?: number;
      error?: string;
    }>;
  }>('/api/rpc-health');
}

/**
 * Trigger a deposit scan on the Railway scanner.
 */
export async function triggerDepositScan(options?: { network?: string; maxBlocks?: number }) {
  return callScanner<{
    ok: boolean;
    durationMs: number;
    networks: Array<{
      network: string;
      scannedBlocks: number;
      matches: number;
      credited: number;
      errors: number;
    }>;
  }>('/api/scan', 'POST', options);
}

/**
 * Get the last automatic scan result from the Railway scanner.
 */
export async function getLastScanResult() {
  return callScanner<{
    ok: boolean;
    lastScan: {
      timestamp: string;
      networks: Array<{
        network: string;
        scannedBlocks: number;
        fromBlock: number;
        toBlock: number;
        matches: number;
        credited: number;
        pendingConfirmations: number;
        errors: number;
        durationMs: number;
      }>;
      totalCredited: number;
      totalMatches: number;
      totalErrors: number;
      durationMs: number;
    } | null;
  }>('/api/last-scan');
}

/**
 * Trigger withdrawal processing on the Railway scanner.
 */
export async function triggerWithdrawalProcessing() {
  return callScanner<{
    ok: boolean;
    processed: number;
    success: number;
    failed: number;
  }>('/api/process-withdrawals', 'POST');
}
