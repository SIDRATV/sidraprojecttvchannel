/**
 * Blockchain Deposit Scanner Service
 *
 * Scans configured blockchains for incoming deposits to user deposit addresses.
 * Supports Sidra Chain and BSC with per-chain scanning functions.
 *
 * Flow:
 *   1. Test RPC connectivity
 *   2. Load all active deposit addresses from DB
 *   3. Fetch latest block number
 *   4. Scan recent blocks for transactions TO user addresses
 *   5. Wait for minimum confirmations
 *   6. Credit user balance via wallet_credit_deposit RPC
 *   7. Update last_checked_block for each address
 *   8. Write audit logs
 */

import { ethers } from 'ethers';
import { createServerClient } from '@/lib/supabase';
import { walletConfig } from './config';
import { CHAIN_CONFIGS, getActiveNetworks, type ChainConfig } from './chains';
import type { WalletNetwork } from './types';

// ─── Logging helpers ──────────────────────────────────────────

const log = (level: 'info' | 'warn' | 'error', network: string, message: string, meta?: Record<string, unknown>) => {
  const prefix = `[DepositScanner][${network.toUpperCase()}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}${metaStr}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}${metaStr}`);
      break;
    default:
      console.log(`${prefix} ${message}${metaStr}`);
  }
};

// ─── RPC Health Check ─────────────────────────────────────────

export interface RpcHealthResult {
  network: WalletNetwork;
  connected: boolean;
  latestBlock?: number;
  latencyMs?: number;
  error?: string;
  rpcUrl: string;
}

/**
 * Test RPC connectivity for a single chain.
 */
export const testRpcConnection = async (network: WalletNetwork): Promise<RpcHealthResult> => {
  const config = CHAIN_CONFIGS[network];
  if (!config?.rpcUrl) {
    return { network, connected: false, error: 'RPC URL not configured', rpcUrl: '' };
  }

  const start = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const [blockNumber, net] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork().catch(() => null),
    ]);
    const latencyMs = Date.now() - start;

    const chainIdMatch = net ? Number(net.chainId) === config.chainId : true;

    if (!chainIdMatch) {
      log('warn', network, `Chain ID mismatch: expected ${config.chainId}, got ${Number(net?.chainId)}`);
    }

    log('info', network, `RPC connected — block ${blockNumber}, latency ${latencyMs}ms`);

    return {
      network,
      connected: true,
      latestBlock: blockNumber,
      latencyMs,
      rpcUrl: config.rpcUrl.replace(/\/\/.*@/, '//***@'), // mask credentials
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const errorMsg = err?.message || 'Unknown error';
    log('error', network, `RPC CONNECTION FAILED: ${errorMsg}`, { latencyMs });
    return {
      network,
      connected: false,
      error: errorMsg,
      latencyMs,
      rpcUrl: config.rpcUrl.replace(/\/\/.*@/, '//***@'),
    };
  }
};

/**
 * Test RPC connectivity for all active networks.
 */
export const testAllRpcConnections = async (): Promise<RpcHealthResult[]> => {
  const networks = getActiveNetworks();
  const results: RpcHealthResult[] = [];

  for (const network of networks) {
    const result = await testRpcConnection(network);
    results.push(result);
  }

  return results;
};

// ─── Deposit Scanner Types ────────────────────────────────────

export interface ScanResult {
  network: WalletNetwork;
  scannedBlocks: number;
  fromBlock: number;
  toBlock: number;
  matches: number;
  credited: number;
  pendingConfirmations: number;
  errors: number;
  durationMs: number;
}

// ─── Per-chain Scan Functions ─────────────────────────────────

/**
 * Scans the Sidra chain for deposits.
 */
export const scanSidraDeposits = async (options?: { maxBlocks?: number }): Promise<ScanResult> => {
  return scanChainDeposits('sidra', options);
};

/**
 * Scans the BSC chain for deposits.
 */
export const scanBscDeposits = async (options?: { maxBlocks?: number }): Promise<ScanResult> => {
  return scanChainDeposits('bsc', options);
};

// ─── Core Scan Logic ──────────────────────────────────────────

const roundAmount = (amount: number): number => Number(amount.toFixed(8));

/**
 * Scan a single chain for deposits to user addresses.
 * This is the core scanning logic used by both scanSidraDeposits and scanBscDeposits.
 */
async function scanChainDeposits(
  network: WalletNetwork,
  options?: { maxBlocks?: number }
): Promise<ScanResult> {
  const startTime = Date.now();
  const config = CHAIN_CONFIGS[network];
  const supabase = createServerClient();

  const result: ScanResult = {
    network,
    scannedBlocks: 0,
    fromBlock: 0,
    toBlock: 0,
    matches: 0,
    credited: 0,
    pendingConfirmations: 0,
    errors: 0,
    durationMs: 0,
  };

  // Step 1: Create provider and test connection
  if (!config?.rpcUrl) {
    log('error', network, 'RPC URL not configured — skipping scan');
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  let latestBlock: number;
  try {
    latestBlock = await provider.getBlockNumber();
    log('info', network, `Scanning blocks... Latest block: ${latestBlock}`);
  } catch (rpcErr: any) {
    log('error', network, `RPC CONNECTION FAILED: ${rpcErr?.message}`);
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Step 2: Load all active deposit addresses for this network
  const { data: addresses, error: addressError } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, user_id, address, network, last_checked_block')
    .eq('is_active', true)
    .eq('network', network);

  if (addressError) {
    log('error', network, `Failed to load deposit addresses: ${addressError.message}`);
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  if (!addresses || addresses.length === 0) {
    log('info', network, 'No active deposit addresses — nothing to scan');
    result.durationMs = Date.now() - startTime;
    return result;
  }

  log('info', network, `Loaded ${addresses.length} deposit addresses to monitor`);

  // Build address lookup map (address → deposit address record)
  const byAddress = new Map<string, (typeof addresses)[0]>();
  for (const row of addresses) {
    byAddress.set(String(row.address).toLowerCase(), row);
  }

  // Step 3: Calculate block range
  const maxBlocks = Math.max(10, Math.min(2000, options?.maxBlocks || config.maxBlocksPerScan));
  const minConfirmations = config.minConfirmations || walletConfig.minConfirmations || 3;

  // Find the lowest last_checked_block across all addresses
  const trackedBlocks = addresses
    .map((row) => Number(row.last_checked_block || 0))
    .filter((v) => v > 0);

  const minTracked = trackedBlocks.length > 0 ? Math.min(...trackedBlocks) : 0;

  // Fallback: scan last `maxBlocks` blocks if no tracking data exists
  const fallbackFrom = Math.max(0, latestBlock - maxBlocks);
  const startBlock = minTracked > 0
    ? Math.max(minTracked + 1, fallbackFrom)
    : fallbackFrom;

  // Don't scan beyond latestBlock - minConfirmations (leave unconfirmed blocks for next cycle)
  const safeToBlock = Math.max(startBlock, latestBlock - minConfirmations);

  result.fromBlock = startBlock;
  result.toBlock = safeToBlock;

  if (startBlock > safeToBlock) {
    log('info', network, `No new confirmed blocks to scan (latest=${latestBlock}, safe=${safeToBlock}, start=${startBlock})`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const totalBlocks = safeToBlock - startBlock + 1;
  log('info', network, `Scanning blocks ${startBlock} → ${safeToBlock} (${totalBlocks} blocks, ${minConfirmations} confirmations required)`);

  // Step 4: Scan blocks
  for (let blockNumber = startBlock; blockNumber <= safeToBlock; blockNumber++) {
    let block: ethers.Block | null = null;
    try {
      block = await provider.getBlock(blockNumber, true);
    } catch (blockErr: any) {
      log('warn', network, `Failed to fetch block ${blockNumber}: ${blockErr?.message}`);
      result.errors++;
      continue;
    }

    if (!block) {
      result.scannedBlocks++;
      continue;
    }

    // ethers v6: use prefetchedTransactions for full tx objects
    let transactions: ethers.TransactionResponse[] = [];
    try {
      transactions = block.prefetchedTransactions || [];
    } catch {
      // Fallback: fetch individual transactions by hash
      for (const txHash of block.transactions) {
        try {
          const tx = await provider.getTransaction(txHash);
          if (tx) transactions.push(tx);
        } catch {
          // skip
        }
      }
    }

    if (transactions.length === 0) {
      result.scannedBlocks++;
      continue;
    }

    // Check each transaction
    for (const tx of transactions) {
      const to = tx.to?.toLowerCase();
      if (!to || !byAddress.has(to) || tx.value <= 0n) {
        continue;
      }

      // Deposit match found!
      result.matches++;
      const depositOwner = byAddress.get(to)!;
      const amount = Number(ethers.formatEther(tx.value));
      const confirmations = latestBlock - blockNumber + 1;

      log('info', network, `Deposit detected: TX_HASH=${tx.hash}`, {
        to,
        from: tx.from?.toLowerCase(),
        amount,
        block: blockNumber,
        confirmations,
        userId: depositOwner.user_id,
      });

      // Check confirmations
      if (confirmations < minConfirmations) {
        log('info', network, `Waiting for confirmations: ${confirmations}/${minConfirmations} for tx ${tx.hash}`);
        result.pendingConfirmations++;
        continue;
      }

      // Verify receipt (tx actually succeeded on-chain)
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt || receipt.status !== 1) {
          log('warn', network, `Transaction receipt invalid or reverted: ${tx.hash}`);
          continue;
        }
      } catch (receiptErr: any) {
        log('warn', network, `Failed to fetch receipt for ${tx.hash}: ${receiptErr?.message}`);
        result.errors++;
        continue;
      }

      // Credit the user's internal balance
      try {
        const { error: creditError } = await supabase.rpc('wallet_credit_deposit', {
          p_user_id: depositOwner.user_id,
          p_amount: roundAmount(amount),
          p_tx_hash: tx.hash,
          p_network: network,
          p_deposit_address: to,
          p_confirmations: confirmations,
          p_metadata: {
            block_number: blockNumber,
            from_address: tx.from?.toLowerCase(),
            chain_id: config.chainId,
            explorer_url: `${config.explorerUrl}/tx/${tx.hash}`,
          },
        });

        if (creditError) {
          // "Deposit already credited" is expected for duplicate scans
          if (creditError.message?.includes('already credited')) {
            log('info', network, `Deposit already credited (duplicate): ${tx.hash}`);
          } else {
            log('error', network, `Failed to credit deposit: ${creditError.message}`, { txHash: tx.hash });
            result.errors++;
          }
          continue;
        }

        result.credited++;
        log('info', network, `User credited: ${roundAmount(amount)} ${config.symbol}`, {
          userId: depositOwner.user_id,
          txHash: tx.hash,
          block: blockNumber,
          confirmations,
        });

        // Write audit log
        try {
          await supabase.from('wallet_audit_logs').insert({
            actor_user_id: depositOwner.user_id,
            action: 'wallet.deposit.credited',
            target_id: tx.hash,
            details: {
              amount: roundAmount(amount),
              address: to,
              from_address: tx.from?.toLowerCase(),
              confirmations,
              block_number: blockNumber,
              network,
              chain_id: config.chainId,
            },
          });
        } catch {
          // best-effort audit
        }
      } catch (creditErr: any) {
        // Duplicate deposit (tx_hash already exists) — safe to ignore
        if (creditErr?.message?.includes('already credited') || creditErr?.message?.includes('duplicate')) {
          log('info', network, `Deposit already processed: ${tx.hash}`);
        } else {
          log('error', network, `Error crediting deposit: ${creditErr?.message}`, { txHash: tx.hash });
          result.errors++;
        }
      }
    }

    result.scannedBlocks++;
  }

  // Step 5: Update last_checked_block for all addresses
  const updatePromises = addresses.map((row) =>
    supabase
      .from('wallet_deposit_addresses')
      .update({ last_checked_block: safeToBlock })
      .eq('id', row.id)
  );
  await Promise.all(updatePromises);

  result.durationMs = Date.now() - startTime;

  log('info', network, `Scan complete`, {
    blocks: result.scannedBlocks,
    matches: result.matches,
    credited: result.credited,
    pendingConfirmations: result.pendingConfirmations,
    errors: result.errors,
    durationMs: result.durationMs,
    range: `${result.fromBlock}-${result.toBlock}`,
  });

  return result;
}

// ─── Full Scan (All Chains) ───────────────────────────────────

export interface FullScanResult {
  timestamp: string;
  networks: ScanResult[];
  totalCredited: number;
  totalMatches: number;
  totalErrors: number;
  durationMs: number;
}

/**
 * Run deposit scan across all configured chains.
 * Called by the cron endpoint.
 */
export const runFullDepositScan = async (options?: { maxBlocks?: number }): Promise<FullScanResult> => {
  const startTime = Date.now();
  const activeNetworks = getActiveNetworks();

  console.log(`[DepositScanner] Starting full scan across ${activeNetworks.length} networks: ${activeNetworks.join(', ')}`);

  const results: ScanResult[] = [];

  for (const network of activeNetworks) {
    try {
      const scanResult = network === 'sidra'
        ? await scanSidraDeposits(options)
        : await scanBscDeposits(options);
      results.push(scanResult);
    } catch (err: any) {
      console.error(`[DepositScanner] Scan failed for ${network}:`, err?.message);
      results.push({
        network,
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

  const totalCredited = results.reduce((s, r) => s + r.credited, 0);
  const totalMatches = results.reduce((s, r) => s + r.matches, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  const durationMs = Date.now() - startTime;

  console.log(`[DepositScanner] Full scan complete: credited=${totalCredited} matches=${totalMatches} errors=${totalErrors} duration=${durationMs}ms`);

  return {
    timestamp: new Date().toISOString(),
    networks: results,
    totalCredited,
    totalMatches,
    totalErrors,
    durationMs,
  };
};
