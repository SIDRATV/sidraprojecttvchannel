/**
 * Standalone Blockchain Deposit Scanner
 * ======================================
 * Designed to run as a one-shot job via GitHub Actions (every 3 minutes).
 *
 * For each configured chain (Sidra, BSC):
 *   1. Connect to RPC, get latest block number
 *   2. Load active deposit addresses from Supabase
 *   3. Calculate block range: fromBlock = last_checked_block + 1, toBlock = latestBlock - confirmations
 *   4. Scan blocks for transactions TO deposit addresses
 *   5. Verify transaction receipt (status === 1)
 *   6. Credit user via wallet_credit_deposit() PostgreSQL RPC
 *   7. Update last_checked_block
 *   8. Write audit log
 *
 * Environment variables (set as GitHub Secrets):
 *   SUPABASE_URL, SUPABASE_KEY, RPC_URL_SIDRA, RPC_URL_BSC, SCAN_API_KEY
 */

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// ─── Configuration ────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[FATAL] Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHAINS = {
  sidra: {
    network: 'sidra',
    chainId: 97453,
    name: 'Sidra Chain',
    symbol: 'SIDRA',
    decimals: 18,
    rpcUrl: process.env.RPC_URL_SIDRA || 'https://node.sidrachain.com',
    explorerUrl: 'https://ledger.sidrachain.com',
    minConfirmations: 3,
    maxBlocksPerScan: 250,
  },
  bsc: {
    network: 'bsc',
    chainId: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: process.env.RPC_URL_BSC || 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    minConfirmations: 3,
    maxBlocksPerScan: 100,
  },
};

// ─── Logging ──────────────────────────────────────────────────

function log(level, component, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
  };
  if (meta) entry.meta = meta;
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

// ─── Helpers ──────────────────────────────────────────────────

const roundAmount = (amount) => Number(Number(amount).toFixed(8));

// ─── Core Scan Logic (per chain) ─────────────────────────────

async function scanChainDeposits(network) {
  const startTime = Date.now();
  const chain = CHAINS[network];

  const result = {
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

  if (!chain || !chain.rpcUrl) {
    log('error', 'scanner', `No RPC URL for ${network} — skipping`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

  // 1. Get latest block
  let latestBlock;
  try {
    latestBlock = await provider.getBlockNumber();
    log('info', 'scanner', `Latest block: ${latestBlock}`, { network });
  } catch (err) {
    log('error', 'scanner', `RPC CONNECTION FAILED for ${network}: ${err.message}`);
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // 2. Load active deposit addresses
  const { data: addresses, error: addrErr } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, user_id, address, network, last_checked_block')
    .eq('is_active', true)
    .eq('network', network);

  if (addrErr) {
    log('error', 'scanner', `Failed to load deposit addresses: ${addrErr.message}`, { network });
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  if (!addresses || addresses.length === 0) {
    log('info', 'scanner', `No active deposit addresses on ${network} — nothing to scan`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  log('info', 'scanner', `Monitoring ${addresses.length} deposit addresses`, { network });

  // Build address lookup
  const byAddress = new Map();
  for (const row of addresses) {
    byAddress.set(String(row.address).toLowerCase(), row);
  }

  // 3. Calculate block range — fromBlock = lastCheckedBlock + 1; toBlock = latestBlock - confirmations
  const maxBlocks = chain.maxBlocksPerScan;
  const minConfirmations = chain.minConfirmations;

  const trackedBlocks = addresses
    .map((row) => Number(row.last_checked_block || 0))
    .filter((v) => v > 0);

  const minTracked = trackedBlocks.length > 0 ? Math.min(...trackedBlocks) : 0;
  const fallbackFrom = Math.max(0, latestBlock - maxBlocks);

  // Resume from last_checked_block + 1 or fall back to last maxBlocks
  const startBlock = minTracked > 0
    ? Math.max(minTracked + 1, fallbackFrom)
    : fallbackFrom;

  // Only scan blocks with enough confirmations
  const safeToBlock = Math.max(startBlock, latestBlock - minConfirmations);

  result.fromBlock = startBlock;
  result.toBlock = safeToBlock;

  if (startBlock > safeToBlock) {
    log('info', 'scanner', `No new confirmed blocks to scan`, { network, latestBlock, safeToBlock, startBlock });
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const totalBlocks = safeToBlock - startBlock + 1;
  log('info', 'scanner', `Scanning blocks ${startBlock} → ${safeToBlock} (${totalBlocks} blocks, ${minConfirmations} confirmations required)`, { network });

  // 4. Scan each block
  for (let blockNumber = startBlock; blockNumber <= safeToBlock; blockNumber++) {
    let block = null;
    try {
      // Pass true to prefetch full transaction objects
      block = await provider.getBlock(blockNumber, true);
    } catch (blockErr) {
      log('warn', 'scanner', `Failed to fetch block ${blockNumber}: ${blockErr.message}`, { network });
      result.errors++;
      continue;
    }

    if (!block) {
      result.scannedBlocks++;
      continue;
    }

    // ethers v6: block.prefetchedTransactions has full TransactionResponse objects
    // block.transactions only has string hashes — DO NOT use those for scanning
    let transactions = [];
    try {
      transactions = block.prefetchedTransactions || [];
    } catch {
      // Fallback: fetch individually (slower but works on all RPC providers)
      for (const txHash of block.transactions) {
        try {
          const tx = await provider.getTransaction(txHash);
          if (tx) transactions.push(tx);
        } catch {
          // skip individual tx fetch errors
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
      const depositOwner = byAddress.get(to);
      const amount = Number(ethers.formatEther(tx.value));
      const confirmations = latestBlock - blockNumber + 1;

      log('info', 'scanner', `Deposit detected: TX_HASH=${tx.hash}`, {
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
        log('info', 'scanner', `Waiting for confirmations: ${confirmations}/${minConfirmations} for tx ${tx.hash}`, { network });
        result.pendingConfirmations++;
        continue;
      }

      // Verify receipt (successful on-chain)
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt || receipt.status !== 1) {
          log('warn', 'scanner', `Transaction receipt invalid or reverted: ${tx.hash}`, { network });
          continue;
        }
      } catch (receiptErr) {
        log('warn', 'scanner', `Failed to fetch receipt for ${tx.hash}: ${receiptErr.message}`, { network });
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
            credited_by: 'github-actions-scanner',
          },
        });

        if (creditError) {
          if (creditError.message?.includes('already credited')) {
            log('info', 'scanner', `Deposit already credited (duplicate): ${tx.hash}`, { network });
          } else {
            log('error', 'scanner', `Failed to credit deposit: ${creditError.message}`, { network, txHash: tx.hash });
            result.errors++;
          }
          continue;
        }

        result.credited++;
        log('info', 'scanner', `✓ User credited: ${roundAmount(amount)} ${chain.symbol}`, {
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
            credited_by: 'github-actions-scanner',
          },
        }).then(() => {});
      } catch (creditErr) {
        if (creditErr?.message?.includes('already credited') || creditErr?.message?.includes('duplicate')) {
          log('info', 'scanner', `Deposit already processed: ${tx.hash}`, { network });
        } else {
          log('error', 'scanner', `Error crediting deposit: ${creditErr?.message}`, { network, txHash: tx.hash });
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

  log('info', 'scanner', `Scan complete`, {
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

// ─── Full Scan (all chains) ──────────────────────────────────

async function runFullScan() {
  const startTime = Date.now();
  const activeChains = Object.keys(CHAINS).filter((n) => !!CHAINS[n].rpcUrl);

  log('info', 'main', `=== GitHub Actions Deposit Scanner ===`);
  log('info', 'main', `Scanning ${activeChains.length} networks: ${activeChains.join(', ')}`);

  const results = [];

  for (const network of activeChains) {
    try {
      const scanResult = await scanChainDeposits(network);
      results.push(scanResult);
    } catch (err) {
      log('error', 'main', `Scan failed for ${network}: ${err.message}`);
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
  const totalBlocks = results.reduce((s, r) => s + r.scannedBlocks, 0);
  const durationMs = Date.now() - startTime;

  // Summary
  console.log('\n========================================');
  console.log('       SCAN SUMMARY');
  console.log('========================================');
  for (const r of results) {
    console.log(`  ${r.network.toUpperCase()}: ${r.scannedBlocks} blocks scanned, ${r.matches} matches, ${r.credited} credited, ${r.errors} errors (${r.fromBlock}→${r.toBlock})`);
  }
  console.log('----------------------------------------');
  console.log(`  TOTAL: ${totalBlocks} blocks, ${totalMatches} matches, ${totalCredited} credited, ${totalErrors} errors`);
  console.log(`  Duration: ${durationMs}ms`);
  console.log('========================================\n');

  if (totalErrors > 0) {
    log('warn', 'main', `Scan completed with ${totalErrors} errors`);
  } else {
    log('info', 'main', `Scan completed successfully in ${durationMs}ms`);
  }

  // Exit with error code if critical errors occurred
  if (results.every((r) => r.errors > 0 && r.scannedBlocks === 0)) {
    log('error', 'main', 'All chains failed — exiting with error');
    process.exit(1);
  }
}

// ─── Entry point ─────────────────────────────────────────────

runFullScan().catch((err) => {
  log('error', 'main', `Fatal error: ${err.message}`);
  process.exit(1);
});
