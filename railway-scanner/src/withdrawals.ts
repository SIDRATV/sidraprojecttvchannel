/**
 * Withdrawal Processor
 *
 * Picks up pending/failed withdrawals from DB, broadcasts them on-chain
 * via the hot wallet signer, and updates status accordingly.
 */

import { ethers } from 'ethers';
import { getSupabase } from './supabase';
import { config, CHAINS, type WalletNetwork } from './config';
import { logger } from './logger';

// ─── Helpers ──────────────────────────────────────────────────

function getProvider(network: WalletNetwork): ethers.JsonRpcProvider {
  const chain = CHAINS[network];
  if (!chain?.rpcUrl) throw new Error(`No RPC URL for ${network}`);
  return new ethers.JsonRpcProvider(chain.rpcUrl);
}

function getSigner(network: WalletNetwork): ethers.Wallet {
  const key = network === 'sidra' ? config.hotWalletKeySidra : config.hotWalletKeyBsc;
  if (!key) throw new Error(`Hot wallet key not configured for ${network}`);
  return new ethers.Wallet(key, getProvider(network));
}

function normalizeNetwork(value?: string | null): WalletNetwork {
  const n = String(value || 'sidra').trim().toLowerCase();
  if (n === 'sidra' || n === 'bsc') return n;
  return 'sidra';
}

// ─── Types ────────────────────────────────────────────────────

export interface WithdrawalProcessResult {
  processed: number;
  success: number;
  failed: number;
  results: Array<{
    withdrawalId: string;
    status: 'success' | 'failed';
    txHash?: string;
    error?: string;
  }>;
}

// ─── Processing ───────────────────────────────────────────────

async function markWithdrawalSuccess(withdrawal: any, txHash: string) {
  const supabase = getSupabase();

  await supabase
    .from('wallet_withdrawals')
    .update({
      status: 'success',
      tx_hash: txHash,
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
        retry_count: withdrawal.attempts || 0,
        error_message: null,
        metadata: {
          phase: 'broadcasted',
          confirmed_at: new Date().toISOString(),
          processed_by: 'railway-scanner',
        },
      })
      .eq('id', withdrawal.wallet_transaction_id);
  }
}

async function refundFailedWithdrawal(withdrawal: any, reason: string) {
  const supabase = getSupabase();

  const { data: account } = await supabase
    .from('wallet_accounts')
    .select('balance')
    .eq('user_id', withdrawal.user_id)
    .maybeSingle();

  const currentBalance = Number(account?.balance || 0);
  const refundAmount = Number(withdrawal.amount || 0) + Number(withdrawal.fee || 0);

  await supabase
    .from('wallet_accounts')
    .update({ balance: currentBalance + refundAmount })
    .eq('user_id', withdrawal.user_id);

  await supabase.from('wallet_transactions').insert({
    user_id: withdrawal.user_id,
    type: 'adjustment',
    direction: 'credit',
    amount: refundAmount,
    fee: 0,
    status: 'success',
    description: 'Automatic refund for failed withdrawal',
    metadata: {
      source_withdrawal_id: withdrawal.id,
      reason,
      processed_by: 'railway-scanner',
    },
  });

  logger.info('withdrawals', `Refund issued for withdrawal ${withdrawal.id}: ${refundAmount}`, {
    userId: withdrawal.user_id,
  });
}

async function markWithdrawalFailed(withdrawal: any, errorMessage: string) {
  const supabase = getSupabase();
  const attempts = Number(withdrawal.attempts || 0) + 1;
  const shouldRetry = attempts < config.maxWithdrawalRetries;
  const nextRetry = shouldRetry
    ? new Date(Date.now() + config.withdrawalRetryDelayMinutes * 60 * 1000).toISOString()
    : null;

  await supabase
    .from('wallet_withdrawals')
    .update({
      attempts,
      status: 'failed',
      last_error: errorMessage,
      next_retry_at: nextRetry,
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
          processed_by: 'railway-scanner',
        },
      })
      .eq('id', withdrawal.wallet_transaction_id);
  }

  if (!shouldRetry) {
    await refundFailedWithdrawal(withdrawal, errorMessage);
  }
}

async function processSingleWithdrawal(withdrawal: any) {
  const network = normalizeNetwork(withdrawal.network);

  let signer: ethers.Wallet;
  try {
    signer = getSigner(network);
  } catch (err: any) {
    await markWithdrawalFailed(withdrawal, `Signer not available: ${err.message}`);
    return { withdrawalId: withdrawal.id, status: 'failed' as const, error: err.message };
  }

  const destinationAddress = String(withdrawal.to_address || '').trim();

  if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
    await markWithdrawalFailed(withdrawal, 'Invalid destination address');
    return { withdrawalId: withdrawal.id, status: 'failed' as const, error: 'Invalid destination address' };
  }

  try {
    const tx = await signer.sendTransaction({
      to: destinationAddress,
      value: ethers.parseEther(String(withdrawal.amount)),
    });

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) {
      throw new Error('On-chain withdrawal reverted');
    }

    await markWithdrawalSuccess(withdrawal, tx.hash);

    logger.info('withdrawals', `Withdrawal success: ${tx.hash}`, {
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      network,
    });

    // Audit log
    await getSupabase().from('wallet_audit_logs').insert({
      actor_user_id: withdrawal.user_id,
      action: 'wallet.withdrawal.success',
      target_id: withdrawal.id,
      details: {
        txHash: tx.hash,
        amount: Number(withdrawal.amount),
        network,
        processed_by: 'railway-scanner',
      },
    }).then(() => {});

    return { withdrawalId: withdrawal.id, status: 'success' as const, txHash: tx.hash };
  } catch (error: any) {
    await markWithdrawalFailed(withdrawal, error?.message || 'Broadcast failed');

    logger.error('withdrawals', `Withdrawal failed: ${error?.message}`, {
      withdrawalId: withdrawal.id,
      network,
    });

    return { withdrawalId: withdrawal.id, status: 'failed' as const, error: error?.message };
  }
}

export async function processPendingWithdrawals(): Promise<WithdrawalProcessResult> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const limit = config.maxWithdrawalsPerCycle;

  const { data: withdrawals, error } = await supabase
    .from('wallet_withdrawals')
    .select('id, user_id, amount, fee, to_address, network, status, attempts, next_retry_at, wallet_transaction_id')
    .in('status', ['pending', 'failed'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('withdrawals', `Failed to load withdrawals: ${error.message}`);
    return { processed: 0, success: 0, failed: 0, results: [] };
  }

  if (!withdrawals || withdrawals.length === 0) {
    return { processed: 0, success: 0, failed: 0, results: [] };
  }

  logger.info('withdrawals', `Processing ${withdrawals.length} pending withdrawals`);

  const results = [];
  for (const w of withdrawals) {
    const r = await processSingleWithdrawal(w);
    results.push(r);
  }

  return {
    processed: results.length,
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}
