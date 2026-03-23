/**
 * Blockchain Deposit Scanner
 *
 * Core scanning logic for detecting deposits on Sidra Chain and BSC.
 *
 * For each configured chain:
 *   1. Connect to RPC, get latest block number
 *   2. Load active deposit addresses from DB
 *   3. Calculate block range based on last_checked_block
 *   4. Scan blocks for transactions TO deposit addresses
 *   5. Wait for min confirmations, verify receipt
 *   6. Credit user via wallet_credit_deposit() PostgreSQL RPC
 *   7. Update last_checked_block
 *   8. Write audit logs
 */

import { ethers } from 'ethers';
import { getSupabase } from './supabase';
import { CHAINS, type ChainConfig, type WalletNetwork } from './config';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────

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

export interface RpcHealthResult {
  network: WalletNetwork;
  connected: boolean;
  latestBlock?: number;
  latencyMs?: number;
  chainId?: number;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const roundAmount = (amount: number): number => Number(amount.toFixed(8));

// ─── RPC Health ───────────────────────────────────────────────

export async function testRpcConnection(network: WalletNetwork): Promise<RpcHealthResult> {
  const chain = CHAINS[network];
  if (!chain?.rpcUrl) {
    return { network, connected: false, error: 'RPC URL not configured' };
  }

  const start = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const [blockNumber, net] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork().catch(() => null),
    ]);
    const latencyMs = Date.now() - start;
    const chainId = net ? Number(net.chainId) : undefined;

    if (chainId && chainId !== chain.chainId) {
      logger.warn('rpc', `Chain ID mismatch on ${network}: expected ${chain.chainId}, got ${chainId}`);
    }

    logger.info('rpc', `${network} connected — block ${blockNumber}, ${latencyMs}ms`);
    return { network, connected: true, latestBlock: blockNumber, latencyMs, chainId };
  } catch (err: any) {
    logger.error('rpc', `RPC CONNECTION FAILED for ${network}: ${err?.message}`);
    return { network, connected: false, error: err?.message, latencyMs: Date.now() - start };
  }
}

export async function testAllRpcConnections(): Promise<RpcHealthResult[]> {
  const results: RpcHealthResult[] = [];
  for (const network of Object.keys(CHAINS) as WalletNetwork[]) {
    if (CHAINS[network].rpcUrl) {
      results.push(await testRpcConnection(network));
    }
  }
  return results;
}

// ─── Per-chain scan functions ─────────────────────────────────

export async function scanSidraDeposits(maxBlocks?: number): Promise<ScanResult> {
  return scanChainDeposits('sidra', maxBlocks);
}

export async function scanBscDeposits(maxBlocks?: number): Promise<ScanResult> {
  return scanChainDeposits('bsc', maxBlocks);
}

// ─── Core scan logic ──────────────────────────────────────────

async function scanChainDeposits(
  network: WalletNetwork,
  maxBlocksOverride?: number
): Promise<ScanResult> {
  const startTime = Date.now();
  const chain = CHAINS[network];
  const supabase = getSupabase();

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

  if (!chain?.rpcUrl) {
    logger.error('scanner', `No RPC URL for ${network} — skipping`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

  // 1. Get latest block
  let latestBlock: number;
  try {
    latestBlock = await provider.getBlockNumber();
    logger.info('scanner', `Scanning blocks... Latest block: ${latestBlock}`, { network });
  } catch (rpcErr: any) {
    logger.error('scanner', `RPC CONNECTION FAILED for ${network}: ${rpcErr?.message}`);
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // 2. Load active deposit addresses for this network
  const { data: addresses, error: addrErr } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, user_id, address, network, last_checked_block')
    .eq('is_active', true)
    .eq('network', network);

  if (addrErr) {
    logger.error('scanner', `Failed to load deposit addresses: ${addrErr.message}`, { network });
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  if (!addresses || addresses.length === 0) {
    logger.info('scanner', `No active deposit addresses on ${network} — nothing to scan`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  logger.info('scanner', `Monitoring ${addresses.length} deposit addresses`, { network });

  // Build address lookup map
  const byAddress = new Map<string, (typeof addresses)[0]>();
  for (const row of addresses) {
    byAddress.set(String(row.address).toLowerCase(), row);
  }

  // 3. Calculate block range
  const maxBlocks = Math.max(10, Math.min(2000, maxBlocksOverride || chain.maxBlocksPerScan));
  const minConfirmations = chain.minConfirmations;

  const trackedBlocks = addresses
    .map((row) => Number(row.last_checked_block || 0))
    .filter((v) => v > 0);

  const minTracked = trackedBlocks.length > 0 ? Math.min(...trackedBlocks) : 0;
  const fallbackFrom = Math.max(0, latestBlock - maxBlocks);

  // If we have tracking data, resume from last_checked_block + 1
  // Otherwise fall back to scanning the last maxBlocks blocks
  const startBlock = minTracked > 0
    ? Math.max(minTracked + 1, fallbackFrom)
    : fallbackFrom;

  // Only scan blocks with enough confirmations
  const safeToBlock = Math.max(startBlock, latestBlock - minConfirmations);

  result.fromBlock = startBlock;
  result.toBlock = safeToBlock;

  if (startBlock > safeToBlock) {
    logger.info('scanner', `No new confirmed blocks to scan`, {
      network,
      latestBlock,
      safeToBlock,
      startBlock,
    });
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const totalBlocks = safeToBlock - startBlock + 1;
  logger.info('scanner', `Scanning blocks ${startBlock} → ${safeToBlock} (${totalBlocks} blocks, ${minConfirmations} confirmations required)`, { network });

  // 4. Scan each block
  for (let blockNumber = startBlock; blockNumber <= safeToBlock; blockNumber++) {
    let block: ethers.Block | null = null;
    try {
      // Pass true to prefetch full transaction objects
      block = await provider.getBlock(blockNumber, true);
    } catch (blockErr: any) {
      logger.warn('scanner', `Failed to fetch block ${blockNumber}: ${blockErr?.message}`, { network });
      result.errors++;
      continue;
    }

    if (!block) {
      result.scannedBlocks++;
      continue;
    }

    // ethers v6: block.prefetchedTransactions has full TransactionResponse objects
    // block.transactions only has string hashes — DO NOT use those for scanning
    let transactions: ethers.TransactionResponse[] = [];
    try {
      transactions = block.prefetchedTransactions || [];
    } catch {
      // Fallback: fetch individually (slower but works on all RPC providers)
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

    // 5. Check each transaction for deposit matches
    for (const tx of transactions) {
      const to = tx.to?.toLowerCase();
      if (!to || !byAddress.has(to) || tx.value <= 0n) {
        continue;
      }

      result.matches++;
      const depositOwner = byAddress.get(to)!;
      const amount = Number(ethers.formatEther(tx.value));
      const confirmations = latestBlock - blockNumber + 1;

      logger.info('scanner', `Deposit detected: TX_HASH=${tx.hash}`, {
        network,
        to,
        from: tx.from?.toLowerCase(),
        amount,
        block: blockNumber,
        confirmations,
        userId: depositOwner.user_id,
      });

      // Check confirmations
      if (confirmations < minConfirmations) {
        logger.info('scanner', `Waiting for confirmations: ${confirmations}/${minConfirmations} for tx ${tx.hash}`, { network });
        result.pendingConfirmations++;
        continue;
      }

      // Verify receipt (successful on-chain)
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt || receipt.status !== 1) {
          logger.warn('scanner', `Transaction receipt invalid or reverted: ${tx.hash}`, { network });
          continue;
        }
      } catch (receiptErr: any) {
        logger.warn('scanner', `Failed to fetch receipt for ${tx.hash}: ${receiptErr?.message}`, { network });
        result.errors++;
        continue;
      }

      // 6. Credit user's internal balance via Supabase RPC
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
            chain_id: chain.chainId,
            explorer_url: `${chain.explorerUrl}/tx/${tx.hash}`,
            credited_by: 'railway-scanner',
          },
        });

        if (creditError) {
          if (creditError.message?.includes('already credited')) {
            logger.info('scanner', `Deposit already credited (duplicate): ${tx.hash}`, { network });
          } else {
            logger.error('scanner', `Failed to credit deposit: ${creditError.message}`, { network, txHash: tx.hash });
            result.errors++;
          }
          continue;
        }

        result.credited++;
        logger.info('scanner', `User credited: ${roundAmount(amount)} ${chain.symbol}`, {
          network,
          userId: depositOwner.user_id,
          txHash: tx.hash,
          block: blockNumber,
          confirmations,
        });

        // Write audit log (best-effort)
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
            chain_id: chain.chainId,
            credited_by: 'railway-scanner',
          },
        }).then(() => {});
      } catch (creditErr: any) {
        if (creditErr?.message?.includes('already credited') || creditErr?.message?.includes('duplicate')) {
          logger.info('scanner', `Deposit already processed: ${tx.hash}`, { network });
        } else {
          logger.error('scanner', `Error crediting deposit: ${creditErr?.message}`, { network, txHash: tx.hash });
          result.errors++;
        }
      }
    }

    result.scannedBlocks++;
  }

  // 7. Update last_checked_block for all addresses
  const updatePromises = addresses.map((row) =>
    supabase
      .from('wallet_deposit_addresses')
      .update({ last_checked_block: safeToBlock })
      .eq('id', row.id)
  );
  await Promise.all(updatePromises);

  result.durationMs = Date.now() - startTime;

  logger.info('scanner', `Scan complete`, {
    network,
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

// ─── Full scan (all chains) ───────────────────────────────────

export interface FullScanResult {
  timestamp: string;
  networks: ScanResult[];
  totalCredited: number;
  totalMatches: number;
  totalErrors: number;
  durationMs: number;
}

export async function runFullDepositScan(maxBlocks?: number): Promise<FullScanResult> {
  const startTime = Date.now();
  const activeChains = (Object.keys(CHAINS) as WalletNetwork[]).filter(
    (n) => !!CHAINS[n].rpcUrl
  );

  logger.info('scanner', `Starting full scan across ${activeChains.length} networks: ${activeChains.join(', ')}`);

  const results: ScanResult[] = [];

  for (const network of activeChains) {
    try {
      const scanResult = network === 'sidra'
        ? await scanSidraDeposits(maxBlocks)
        : await scanBscDeposits(maxBlocks);
      results.push(scanResult);
    } catch (err: any) {
      logger.error('scanner', `Scan failed for ${network}: ${err?.message}`);
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

  logger.info('scanner', `Full scan complete: credited=${totalCredited} matches=${totalMatches} errors=${totalErrors} duration=${durationMs}ms`);

  return {
    timestamp: new Date().toISOString(),
    networks: results,
    totalCredited,
    totalMatches,
    totalErrors,
    durationMs,
  };
}
