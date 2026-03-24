/**
 * Withdrawal Processor for GitHub Actions
 * Processes pending/failed withdrawals by sending real blockchain transactions.
 * Runs alongside the deposit scanner every 3 minutes.
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const crypto = require('crypto');

// ─── Environment ───────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

const CHAINS = {
  sidra: {
    rpcUrl: process.env.RPC_URL_SIDRA || 'https://node.sidrachain.com',
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY_SIDRA || '',
  },
  bsc: {
    rpcUrl: process.env.RPC_URL_BSC || 'https://bsc-dataseed.binance.org',
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY_BSC || process.env.HOT_WALLET_PRIVATE_KEY_BSK || '',
  },
};

const MAX_RETRIES = 3;
const MAX_BATCH = 10;

// ─── Supabase client ───────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Decryption (AES-256-GCM, matches src/lib/wallet/crypto.ts) ─────
function decryptText(encrypted) {
  if (!encrypted || !ENCRYPTION_KEY) return encrypted;
  const parts = String(encrypted).split(':');
  if (parts.length !== 3) return encrypted;

  try {
    const [ivHex, authTagHex, cipherHex] = parts;
    const keyHash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encrypted;
  }
}

// ─── Get signer for network ───────────────────────────────
function getSigner(network) {
  const chain = CHAINS[network];
  if (!chain || !chain.privateKey) {
    throw new Error(`No private key configured for network: ${network}`);
  }
  if (!chain.rpcUrl) {
    throw new Error(`No RPC URL configured for network: ${network}`);
  }
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  return new ethers.Wallet(chain.privateKey, provider);
}

// ─── Process a single withdrawal ──────────────────────────
async function processWithdrawal(withdrawal) {
  const network = String(withdrawal.network || 'sidra').toLowerCase();
  const destinationRaw = withdrawal.to_address;

  // Decrypt the destination address
  const destination = decryptText(destinationRaw);
  if (!destination || !ethers.isAddress(destination)) {
    console.error(`  ✗ Invalid address for withdrawal ${withdrawal.id}`);
    await markFailed(withdrawal, 'Invalid encrypted destination address');
    return { id: withdrawal.id, status: 'failed', error: 'Invalid address' };
  }

  console.log(`  → Sending ${withdrawal.amount} to ${destination} on ${network} (attempt ${(withdrawal.attempts || 0) + 1})`);

  try {
    const signer = getSigner(network);
    const tx = await signer.sendTransaction({
      to: destination,
      value: ethers.parseEther(String(withdrawal.amount)),
    });

    console.log(`  → TX broadcasted: ${tx.hash}`);
    const receipt = await tx.wait(1);

    if (!receipt || receipt.status !== 1) {
      throw new Error('On-chain transaction reverted');
    }

    console.log(`  ✓ Confirmed in block ${receipt.blockNumber}`);
    await markSuccess(withdrawal, tx.hash);
    return { id: withdrawal.id, status: 'success', txHash: tx.hash };
  } catch (err) {
    const msg = err?.message || 'Broadcast failed';
    console.error(`  ✗ Failed: ${msg}`);
    await markFailed(withdrawal, msg);
    return { id: withdrawal.id, status: 'failed', error: msg };
  }
}

// ─── Mark withdrawal as success ───────────────────────────
async function markSuccess(withdrawal, txHash) {
  const now = new Date().toISOString();

  await supabase
    .from('wallet_withdrawals')
    .update({
      status: 'success',
      tx_hash: txHash,
      updated_at: now,
      last_error: null,
      next_retry_at: null,
      attempts: (withdrawal.attempts || 0) + 1,
    })
    .eq('id', withdrawal.id);

  if (withdrawal.wallet_transaction_id) {
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'success',
        tx_hash: txHash,
        retry_count: (withdrawal.attempts || 0) + 1,
        error_message: null,
        metadata: { phase: 'broadcasted', confirmed_at: now },
      })
      .eq('id', withdrawal.wallet_transaction_id);
  }

  await supabase.from('wallet_audit_logs').insert({
    actor_user_id: withdrawal.user_id,
    action: 'wallet.withdrawal.success',
    target_id: withdrawal.id,
    details: { txHash, amount: withdrawal.amount, network: withdrawal.network },
  });
}

// ─── Mark withdrawal as failed (with retry or refund) ─────
async function markFailed(withdrawal, errorMessage) {
  const attempts = (withdrawal.attempts || 0) + 1;
  const shouldRetry = attempts < MAX_RETRIES;
  const nextRetry = shouldRetry
    ? new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
    : null;

  await supabase
    .from('wallet_withdrawals')
    .update({
      attempts,
      status: 'failed',
      last_error: errorMessage,
      next_retry_at: nextRetry,
      updated_at: new Date().toISOString(),
    })
    .eq('id', withdrawal.id);

  if (withdrawal.wallet_transaction_id) {
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'failed',
        retry_count: attempts,
        error_message: errorMessage,
        metadata: {
          phase: shouldRetry ? 'retry_scheduled' : 'retry_exhausted',
          next_retry_at: nextRetry,
        },
      })
      .eq('id', withdrawal.wallet_transaction_id);
  }

  // Refund if max retries exhausted
  if (!shouldRetry) {
    console.log(`  ↩ Refunding ${withdrawal.amount} + ${withdrawal.fee} to user ${withdrawal.user_id}`);
    const { data: account } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .maybeSingle();

    const refundAmount = Number(withdrawal.amount || 0) + Number(withdrawal.fee || 0);
    await supabase
      .from('wallet_accounts')
      .update({ balance: Number(account?.balance || 0) + refundAmount })
      .eq('user_id', withdrawal.user_id);

    await supabase.from('wallet_transactions').insert({
      user_id: withdrawal.user_id,
      type: 'adjustment',
      direction: 'credit',
      amount: refundAmount,
      fee: 0,
      status: 'success',
      description: 'Automatic refund for failed withdrawal',
      metadata: { source_withdrawal_id: withdrawal.id, reason: errorMessage },
    });
  }

  await supabase.from('wallet_audit_logs').insert({
    actor_user_id: withdrawal.user_id,
    action: 'wallet.withdrawal.failed',
    target_id: withdrawal.id,
    details: { error: errorMessage, attempts, willRetry: shouldRetry, network: withdrawal.network },
  });
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Withdrawal Processor');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }

  const now = new Date().toISOString();

  // Fetch pending and retryable failed withdrawals
  const { data: withdrawals, error } = await supabase
    .from('wallet_withdrawals')
    .select('id, user_id, amount, fee, to_address, network, status, attempts, next_retry_at, wallet_transaction_id')
    .in('status', ['pending', 'failed'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(MAX_BATCH);

  if (error) {
    console.error('Failed to fetch withdrawals:', error.message);
    process.exit(1);
  }

  if (!withdrawals || withdrawals.length === 0) {
    console.log('No pending withdrawals to process.');
    return;
  }

  console.log(`Found ${withdrawals.length} withdrawal(s) to process\n`);

  let success = 0;
  let failed = 0;

  for (const w of withdrawals) {
    console.log(`[${w.id.slice(0, 8)}] ${w.amount} on ${w.network} — status: ${w.status}`);
    const result = await processWithdrawal(w);
    if (result.status === 'success') success++;
    else failed++;
    console.log('');
  }

  console.log('───────────────────────────────────────');
  console.log(`Results: ${success} success, ${failed} failed out of ${withdrawals.length}`);
  console.log('═══════════════════════════════════════');
}

main().catch((err) => {
  console.error('Withdrawal processor crashed:', err);
  process.exit(1);
});
