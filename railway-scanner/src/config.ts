/**
 * Environment configuration for Railway scanner.
 * All config is read from environment variables.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Warn instead of throw — let the HTTP server start so /health responds
    console.warn(`[config] WARNING: Missing environment variable: ${name}`);
    return '';
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export type WalletNetwork = 'sidra' | 'bsc';

export interface ChainConfig {
  network: WalletNetwork;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  minConfirmations: number;
  maxBlocksPerScan: number;
}

export const config = {
  // Supabase
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Scanner auth
  scannerApiKey: requireEnv('SCANNER_API_KEY'),

  // Scanner settings
  scanIntervalMs: toNumber(process.env.SCAN_INTERVAL_MS, 15_000), // 15 seconds default
  maxBlocksPerScan: toNumber(process.env.MAX_BLOCKS_PER_SCAN, 50),
  minConfirmations: Math.max(1, toNumber(process.env.MIN_CONFIRMATIONS, 3)),

  // Withdrawal processing
  processWithdrawals: process.env.PROCESS_WITHDRAWALS !== 'false',
  maxWithdrawalsPerCycle: toNumber(process.env.MAX_WITHDRAWALS_PER_CYCLE, 5),
  withdrawalRetryDelayMinutes: toNumber(process.env.WITHDRAWAL_RETRY_DELAY_MINUTES, 10),
  maxWithdrawalRetries: toNumber(process.env.MAX_WITHDRAWAL_RETRIES, 3),

  // Hot wallet keys (only needed if processing withdrawals)
  hotWalletKeySidra: optionalEnv('HOT_WALLET_PRIVATE_KEY_SIDRA', ''),
  hotWalletKeyBsc: optionalEnv('HOT_WALLET_PRIVATE_KEY_BSC', ''),

  // HTTP server
  port: toNumber(process.env.PORT, 3001),
};

export const CHAINS: Record<WalletNetwork, ChainConfig> = {
  sidra: {
    network: 'sidra',
    chainId: 97453,
    name: 'Sidra Chain',
    symbol: 'SIDRA',
    decimals: 18,
    rpcUrl: optionalEnv('RPC_URL_SIDRA', 'https://node.sidrachain.com'),
    explorerUrl: 'https://ledger.sidrachain.com',
    minConfirmations: config.minConfirmations,
    maxBlocksPerScan: config.maxBlocksPerScan,
  },
  bsc: {
    network: 'bsc',
    chainId: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: optionalEnv('RPC_URL_BSC', 'https://bsc-dataseed.binance.org'),
    explorerUrl: 'https://bscscan.com',
    minConfirmations: config.minConfirmations,
    maxBlocksPerScan: Math.min(config.maxBlocksPerScan, 100),
  },
};

/**
 * Returns only chains that have an RPC URL configured.
 */
export function getActiveChains(): WalletNetwork[] {
  return (Object.keys(CHAINS) as WalletNetwork[]).filter(
    (n) => !!CHAINS[n].rpcUrl
  );
}
