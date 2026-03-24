/**
 * Standalone Blockchain Deposit Scanner (v2 — two-phase)
 * ======================================================
 * Designed to run as a one-shot job via GitHub Actions (every 3 minutes).
 *
 * Two-phase deposit flow:
 *   Phase 1 — Confirmed blocks (enough confirmations):
 *     Credit user balance via wallet_credit_deposit() or confirm pending deposits.
 *   Phase 2 — Unconfirmed blocks (not enough confirmations yet):
 *     Record as "pending" in wallet_transactions so users see incoming deposits.
 *
 * Additionally, on each run we re-check all existing "pending" deposits and
 * confirm any that have now reached the confirmation threshold.
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

/**
 * Fetch block transactions with fallback.
 * ethers v6: block.prefetchedTransactions has full TransactionResponse objects.
 * block.transactions only has string hashes — DO NOT use those for scanning.
 */
async function getBlockTransactions(provider, blockNumber) {
  let block;
  try {
    block = await provider.getBlock(blockNumber, true);
  } catch (err) {
    log('warn', 'scanner', `Failed to fetch block ${blockNumber}: ${err.message}`);
    return null;
  }
  if (!block) return [];

  let txs = [];
  try {
    txs = block.prefetchedTransactions || [];
  } catch {
    // Fallback: fetch individually (slower but works on all RPC providers)
    for (const txHash of block.transactions) {
      try {
        const tx = await provider.getTransaction(txHash);
        if (tx) txs.push(tx);
      } catch {
        // skip individual tx fetch errors
      }
    }
  }
  return txs;
}

// ─── Record a pending deposit (no balance change) ────────────

async function recordPendingDeposit(depositOwner, tx, amount, blockNumber, confirmations, chain) {
  // Check if this tx already exists in any status
  const { data: existing } = await supabase
    .from('wallet_transactions')
    .select('id, status')
    .eq('tx_hash', tx.hash)
    .eq('user_id', depositOwner.user_id)
    .eq('type', 'deposit')
    .maybeSingle();

  if (existing) {
    // Already tracked — update confirmations in metadata if still pending
    if (existing.status === 'pending') {
      await supabase
        .from('wallet_transactions')
        .update({
          metadata: {
            confirmations,
            block_number: blockNumber,
            from_address: tx.from?.toLowerCase(),
            chain_id: chain.chainId,
            explorer_url: `${chain.explorerUrl}/tx/${tx.hash}`,
            recorded_by: 'github-actions-scanner',
          },
        })
        .eq('id', existing.id);
    }
    return 'already_tracked';
  }

  // Insert new pending deposit (no balance change)
  const { error } = await supabase.from('wallet_transactions').insert({
    user_id: depositOwner.user_id,
    type: 'deposit',
    direction: 'credit',
    amount: roundAmount(amount),
    fee: 0,
    status: 'pending',
    tx_hash: tx.hash,
    network: chain.network,
    deposit_address: tx.to?.toLowerCase(),
    from_address: tx.from?.toLowerCase(),
    description: 'On-chain deposit — waiting for confirmations',
    metadata: {
      confirmations,
      min_confirmations: chain.minConfirmations,
      block_number: blockNumber,
      from_address: tx.from?.toLowerCase(),
      chain_id: chain.chainId,
      explorer_url: `${chain.explorerUrl}/tx/${tx.hash}`,
      recorded_by: 'github-actions-scanner',
    },
  });

  if (error) {
    log('warn', 'scanner', `Failed to record pending deposit: ${error.message}`, { txHash: tx.hash });
    return 'error';
  }

  log('info', 'scanner', `⏳ Pending deposit recorded: ${roundAmount(amount)} ${chain.symbol}`, {
    network: chain.network,
    txHash: tx.hash,
    confirmations: `${confirmations}/${chain.minConfirmations}`,
    userId: depositOwner.user_id,
  });
  return 'recorded';
}

// ─── Credit a confirmed deposit ──────────────────────────────

async function creditDeposit(depositOwner, tx, amount, blockNumber, confirmations, chain, provider) {
  const network = chain.network;

  // Verify receipt (successful on-chain)
  try {
    const receipt = await provider.getTransactionReceipt(tx.hash);
    if (!receipt || receipt.status !== 1) {
      log('warn', 'scanner', `TX receipt invalid or reverted: ${tx.hash}`, { network });
      return 'reverted';
    }
  } catch (receiptErr) {
    log('warn', 'scanner', `Failed to fetch receipt for ${tx.hash}: ${receiptErr.message}`, { network });
    return 'receipt_error';
  }

  // Use wallet_credit_deposit RPC — it handles:
  //   • pending→success (confirms pending + credits balance)
  //   • new→success (inserts + credits balance)
  //   • duplicate detection (raises 'already credited')
  try {
    const { error: creditError } = await supabase.rpc('wallet_credit_deposit', {
      p_user_id: depositOwner.user_id,
      p_amount: roundAmount(amount),
      p_tx_hash: tx.hash,
      p_network: network,
      p_deposit_address: tx.to?.toLowerCase(),
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
        return 'already_credited';
      }
      log('error', 'scanner', `Failed to credit deposit: ${creditError.message}`, { network, txHash: tx.hash });
      return 'error';
    }
  } catch (creditErr) {
    if (creditErr?.message?.includes('already credited') || creditErr?.message?.includes('duplicate')) {
      return 'already_credited';
    }
    log('error', 'scanner', `Error crediting deposit: ${creditErr?.message}`, { network, txHash: tx.hash });
    return 'error';
  }

  log('info', 'scanner', `✓ Deposit credited: ${roundAmount(amount)} ${chain.symbol}`, {
    network, txHash: tx.hash, userId: depositOwner.user_id, block: blockNumber, confirmations,
  });

  // Write audit log (best-effort)
  supabase.from('wallet_audit_logs').insert({
    actor_user_id: depositOwner.user_id,
    action: 'wallet.deposit.credited',
    target_id: tx.hash,
    details: {
      amount: roundAmount(amount),
      address: tx.to?.toLowerCase(),
      from_address: tx.from?.toLowerCase(),
      confirmations, block_number: blockNumber, network,
      chain_id: chain.chainId,
      credited_by: 'github-actions-scanner',
    },
  }).then(() => {});

  return 'credited';
}

// ─── Re-check existing pending deposits ──────────────────────

async function confirmPendingDeposits(network, provider, chain) {
  const { data: pendingTxs, error } = await supabase
    .from('wallet_transactions')
    .select('id, user_id, tx_hash, amount, deposit_address, metadata')
    .eq('type', 'deposit')
    .eq('status', 'pending')
    .eq('network', network);

  if (error || !pendingTxs || pendingTxs.length === 0) {
    if (error) log('warn', 'scanner', `Failed to fetch pending deposits: ${error.message}`, { network });
    return { confirmed: 0, stillPending: 0, failed: 0, hashes: [] };
  }

  log('info', 'scanner', `Re-checking ${pendingTxs.length} pending deposits`, { network });

  let latestBlock;
  try {
    latestBlock = await provider.getBlockNumber();
  } catch {
    return { confirmed: 0, stillPending: pendingTxs.length, failed: 0, hashes: [] };
  }

  let confirmed = 0;
  let stillPending = 0;
  let failed = 0;
  const confirmedHashes = [];

  for (const ptx of pendingTxs) {
    try {
      const receipt = await provider.getTransactionReceipt(ptx.tx_hash);

      if (!receipt) {
        stillPending++;
        continue;
      }

      if (receipt.status !== 1) {
        // Transaction reverted on-chain — mark as failed
        await supabase
          .from('wallet_transactions')
          .update({ status: 'failed', description: 'On-chain transaction reverted', error_message: 'TX reverted' })
          .eq('id', ptx.id);
        failed++;
        log('warn', 'scanner', `Pending deposit reverted on-chain: ${ptx.tx_hash}`, { network });
        continue;
      }

      const txBlock = receipt.blockNumber;
      const confirmations = latestBlock - txBlock + 1;

      // Update confirmations in metadata
      await supabase
        .from('wallet_transactions')
        .update({
          metadata: { ...(ptx.metadata || {}), confirmations, last_check: new Date().toISOString() },
        })
        .eq('id', ptx.id);

      if (confirmations >= chain.minConfirmations) {
        // Enough confirmations — confirm deposit
        await supabase
          .from('wallet_transactions')
          .update({
            status: 'success',
            description: 'On-chain deposit credited',
            metadata: {
              ...(ptx.metadata || {}),
              confirmations,
              confirmed_at: new Date().toISOString(),
              credited_by: 'github-actions-scanner',
            },
          })
          .eq('id', ptx.id);

        // Credit user balance
        // Ensure wallet_accounts exists
        await supabase.from('wallet_accounts').upsert(
          { user_id: ptx.user_id, balance: 0 },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );

        // Increment balance
        const { data: account } = await supabase
          .from('wallet_accounts')
          .select('balance')
          .eq('user_id', ptx.user_id)
          .single();

        if (account) {
          const newBalance = Number(account.balance) + Number(ptx.amount);
          await supabase
            .from('wallet_accounts')
            .update({ balance: newBalance })
            .eq('user_id', ptx.user_id);
        }

        confirmed++;
        confirmedHashes.push(ptx.tx_hash);
        log('info', 'scanner', `✓ Pending deposit confirmed: ${ptx.amount} ${chain.symbol}`, {
          network, txHash: ptx.tx_hash, userId: ptx.user_id, confirmations,
        });

        // Audit log
        supabase.from('wallet_audit_logs').insert({
          actor_user_id: ptx.user_id,
          action: 'wallet.deposit.confirmed',
          target_id: ptx.tx_hash,
          details: {
            amount: Number(ptx.amount), confirmations, network,
            credited_by: 'github-actions-scanner',
          },
        }).then(() => {});
      } else {
        stillPending++;
        log('info', 'scanner', `⏳ Still pending: ${ptx.tx_hash} (${confirmations}/${chain.minConfirmations})`, { network });
      }
    } catch (err) {
      stillPending++;
      log('warn', 'scanner', `Error checking pending deposit ${ptx.tx_hash}: ${err.message}`, { network });
    }
  }

  return { confirmed, stillPending, failed, hashes: confirmedHashes };
}

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
    pendingRecorded: 0,
    pendingConfirmed: 0,
    pendingStill: 0,
    errors: 0,
    durationMs: 0,
    txHashes: { credited: [], pending: [], confirmed: [] },
  };

  if (!chain || !chain.rpcUrl) {
    log('error', 'scanner', `No RPC URL for ${network} — skipping`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // ── Step 1: Connect to RPC ──
  log('info', 'scanner', `[${network.toUpperCase()}] Connecting to RPC: ${chain.rpcUrl}`);
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

  let latestBlock;
  try {
    latestBlock = await provider.getBlockNumber();
    log('info', 'scanner', `[${network.toUpperCase()}] ✓ RPC connected — latest block: ${latestBlock}`, {
      network, rpcUrl: chain.rpcUrl, latestBlock,
    });
  } catch (err) {
    log('error', 'scanner', `[${network.toUpperCase()}] ✗ RPC CONNECTION FAILED: ${err.message}`, {
      network, rpcUrl: chain.rpcUrl,
    });
    result.errors = 1;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // ── Step 2: Re-check existing pending deposits ──
  log('info', 'scanner', `[${network.toUpperCase()}] Checking existing pending deposits...`);
  const pendingResult = await confirmPendingDeposits(network, provider, chain);
  result.pendingConfirmed = pendingResult.confirmed;
  result.pendingStill = pendingResult.stillPending;
  result.txHashes.confirmed = pendingResult.hashes;

  if (pendingResult.confirmed > 0) {
    log('info', 'scanner', `[${network.toUpperCase()}] ${pendingResult.confirmed} pending deposit(s) confirmed`, { network });
  }

  // ── Step 3: Load active deposit addresses ──
  const { data: addresses, error: addrErr } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, user_id, address, network, last_checked_block')
    .eq('is_active', true)
    .eq('network', network);

  if (addrErr) {
    log('error', 'scanner', `Failed to load deposit addresses: ${addrErr.message}`, { network });
    result.errors++;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  if (!addresses || addresses.length === 0) {
    log('info', 'scanner', `[${network.toUpperCase()}] No active deposit addresses — nothing to scan`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  log('info', 'scanner', `[${network.toUpperCase()}] Monitoring ${addresses.length} deposit address(es)`, {
    network, count: addresses.length,
    addresses: addresses.map((a) => a.address.slice(0, 10) + '...'),
  });

  // Build address lookup
  const byAddress = new Map();
  for (const row of addresses) {
    byAddress.set(String(row.address).toLowerCase(), row);
  }

  // ── Step 4: Calculate block ranges ──
  const maxBlocks = chain.maxBlocksPerScan;
  const minConfirmations = chain.minConfirmations;

  const trackedBlocks = addresses
    .map((row) => Number(row.last_checked_block || 0))
    .filter((v) => v > 0);

  const minTracked = trackedBlocks.length > 0 ? Math.min(...trackedBlocks) : 0;
  const fallbackFrom = Math.max(0, latestBlock - maxBlocks);

  const startBlock = minTracked > 0
    ? Math.max(minTracked + 1, fallbackFrom)
    : fallbackFrom;

  // Confirmed range: blocks with enough confirmations
  const safeToBlock = Math.max(startBlock, latestBlock - minConfirmations);
  // Unconfirmed range: recent blocks not yet confirmed
  const pendingFromBlock = safeToBlock + 1;
  const pendingToBlock = latestBlock;

  result.fromBlock = startBlock;
  result.toBlock = latestBlock;

  log('info', 'scanner', `[${network.toUpperCase()}] Block ranges calculated`, {
    network,
    confirmed: startBlock <= safeToBlock ? `${startBlock}→${safeToBlock}` : 'none',
    pending: pendingFromBlock <= pendingToBlock ? `${pendingFromBlock}→${pendingToBlock}` : 'none',
    latestBlock,
    minConfirmations,
  });

  // ── Step 5: Scan CONFIRMED blocks → credit deposits ──
  if (startBlock <= safeToBlock) {
    const totalConfirmedBlocks = safeToBlock - startBlock + 1;
    log('info', 'scanner', `[${network.toUpperCase()}] Phase 1: Scanning ${totalConfirmedBlocks} confirmed blocks (${startBlock}→${safeToBlock})`);

    for (let blockNumber = startBlock; blockNumber <= safeToBlock; blockNumber++) {
      const transactions = await getBlockTransactions(provider, blockNumber);
      if (transactions === null) { result.errors++; continue; }
      if (transactions.length === 0) { result.scannedBlocks++; continue; }

      for (const tx of transactions) {
        const to = tx.to?.toLowerCase();
        if (!to || !byAddress.has(to) || tx.value <= 0n) continue;

        result.matches++;
        const depositOwner = byAddress.get(to);
        const amount = Number(ethers.formatEther(tx.value));
        const confirmations = latestBlock - blockNumber + 1;

        log('info', 'scanner', `[${network.toUpperCase()}] Deposit found in block ${blockNumber}: ${tx.hash}`, {
          network, to, from: tx.from?.toLowerCase(), amount, confirmations,
          userId: depositOwner.user_id,
        });

        const creditResult = await creditDeposit(depositOwner, tx, amount, blockNumber, confirmations, chain, provider);
        if (creditResult === 'credited' || creditResult === 'confirmed_from_pending') {
          result.credited++;
          result.txHashes.credited.push(tx.hash);
        } else if (creditResult === 'error' || creditResult === 'receipt_error') {
          result.errors++;
        }
      }

      result.scannedBlocks++;
    }
  } else {
    log('info', 'scanner', `[${network.toUpperCase()}] Phase 1: No new confirmed blocks to scan`);
  }

  // ── Step 6: Scan UNCONFIRMED blocks → record pending deposits ──
  if (pendingFromBlock <= pendingToBlock) {
    const totalPendingBlocks = pendingToBlock - pendingFromBlock + 1;
    log('info', 'scanner', `[${network.toUpperCase()}] Phase 2: Scanning ${totalPendingBlocks} unconfirmed blocks (${pendingFromBlock}→${pendingToBlock})`);

    for (let blockNumber = pendingFromBlock; blockNumber <= pendingToBlock; blockNumber++) {
      const transactions = await getBlockTransactions(provider, blockNumber);
      if (transactions === null || transactions.length === 0) continue;

      for (const tx of transactions) {
        const to = tx.to?.toLowerCase();
        if (!to || !byAddress.has(to) || tx.value <= 0n) continue;

        const depositOwner = byAddress.get(to);
        const amount = Number(ethers.formatEther(tx.value));
        const confirmations = latestBlock - blockNumber + 1;

        const pendResult = await recordPendingDeposit(depositOwner, tx, amount, blockNumber, confirmations, chain);
        if (pendResult === 'recorded') {
          result.pendingRecorded++;
          result.txHashes.pending.push(tx.hash);
        }
      }
    }
  } else {
    log('info', 'scanner', `[${network.toUpperCase()}] Phase 2: No unconfirmed blocks to check`);
  }

  // ── Step 7: Update last_checked_block (only to safeToBlock) ──
  const updateBlock = Math.max(startBlock, safeToBlock);
  const updatePromises = addresses.map((row) =>
    supabase
      .from('wallet_deposit_addresses')
      .update({ last_checked_block: updateBlock })
      .eq('id', row.id)
  );
  await Promise.all(updatePromises);

  log('info', 'scanner', `[${network.toUpperCase()}] last_checked_block updated to ${updateBlock}`);

  result.durationMs = Date.now() - startTime;

  log('info', 'scanner', `[${network.toUpperCase()}] Scan complete`, {
    network,
    blocksScanned: result.scannedBlocks,
    matches: result.matches,
    credited: result.credited,
    pendingRecorded: result.pendingRecorded,
    pendingConfirmed: result.pendingConfirmed,
    pendingStill: result.pendingStill,
    errors: result.errors,
    durationMs: result.durationMs,
    range: `${result.fromBlock}→${result.toBlock}`,
  });

  return result;
}

// ─── Full Scan (all chains) ──────────────────────────────────

async function runFullScan() {
  const startTime = Date.now();
  const activeChains = Object.keys(CHAINS).filter((n) => !!CHAINS[n].rpcUrl);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     GITHUB ACTIONS — BLOCKCHAIN DEPOSIT SCANNER    ║');
  console.log('╚════════════════════════════════════════════════════╝');
  log('info', 'main', `Scanning ${activeChains.length} network(s): ${activeChains.join(', ')}`);
  log('info', 'main', `Timestamp: ${new Date().toISOString()}`);

  const results = [];

  for (const network of activeChains) {
    try {
      console.log(`\n── ${network.toUpperCase()} ──────────────────────────────────`);
      const scanResult = await scanChainDeposits(network);
      results.push(scanResult);
    } catch (err) {
      log('error', 'main', `Scan failed for ${network}: ${err.message}`);
      results.push({
        network,
        scannedBlocks: 0,
        fromBlock: 0, toBlock: 0,
        matches: 0, credited: 0,
        pendingRecorded: 0, pendingConfirmed: 0, pendingStill: 0,
        errors: 1, durationMs: 0,
        txHashes: { credited: [], pending: [], confirmed: [] },
      });
    }
  }

  // ── Final Report ──
  const totalCredited = results.reduce((s, r) => s + r.credited, 0);
  const totalMatches = results.reduce((s, r) => s + r.matches, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  const totalBlocks = results.reduce((s, r) => s + r.scannedBlocks, 0);
  const totalPendingRecorded = results.reduce((s, r) => s + r.pendingRecorded, 0);
  const totalPendingConfirmed = results.reduce((s, r) => s + r.pendingConfirmed, 0);
  const totalPendingStill = results.reduce((s, r) => s + r.pendingStill, 0);
  const durationMs = Date.now() - startTime;

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                  SCAN REPORT                       ║');
  console.log('╠════════════════════════════════════════════════════╣');
  for (const r of results) {
    console.log(`║ ${r.network.toUpperCase().padEnd(6)} │ Blocks: ${String(r.scannedBlocks).padStart(5)} │ Range: ${r.fromBlock}→${r.toBlock}`);
    console.log(`║        │ Matches: ${String(r.matches).padStart(4)} │ Credited: ${r.credited} │ Errors: ${r.errors}`);
    console.log(`║        │ Pending new: ${r.pendingRecorded} │ Confirmed: ${r.pendingConfirmed} │ Still pending: ${r.pendingStill}`);

    // List transaction hashes
    if (r.txHashes.credited.length > 0) {
      console.log(`║        │ 💰 Credited TXs:`);
      for (const h of r.txHashes.credited) console.log(`║        │    ${h}`);
    }
    if (r.txHashes.pending.length > 0) {
      console.log(`║        │ ⏳ New pending TXs:`);
      for (const h of r.txHashes.pending) console.log(`║        │    ${h}`);
    }
    if (r.txHashes.confirmed.length > 0) {
      console.log(`║        │ ✓ Newly confirmed TXs:`);
      for (const h of r.txHashes.confirmed) console.log(`║        │    ${h}`);
    }
    console.log('╠════════════════════════════════════════════════════╣');
  }
  console.log(`║ TOTALS │ Blocks: ${totalBlocks} │ Matches: ${totalMatches} │ Credited: ${totalCredited}`);
  console.log(`║        │ Pending new: ${totalPendingRecorded} │ Confirmed: ${totalPendingConfirmed} │ Still: ${totalPendingStill}`);
  console.log(`║        │ Errors: ${totalErrors} │ Duration: ${durationMs}ms`);
  console.log('╚════════════════════════════════════════════════════╝');

  if (totalMatches === 0 && totalPendingConfirmed === 0) {
    log('info', 'main', '📭 No deposits detected in this scan run.');
  }

  if (totalErrors > 0) {
    log('warn', 'main', `⚠ Scan completed with ${totalErrors} error(s)`);
  } else {
    log('info', 'main', `✅ Scan completed successfully in ${durationMs}ms`);
  }

  // Exit with error code if ALL chains failed completely
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
