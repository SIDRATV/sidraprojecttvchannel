import { ethers } from 'ethers';
import { createServerClient } from '@/lib/supabase';
import { calcFee, supportedWalletNetworks, walletConfig } from './config';
import { decryptText, encryptText } from './crypto';
import type { InternalTransferInput, WalletBalanceResult, WalletNetwork, WithdrawalInput } from './types';

const roundAmount = (amount: number): number => Number(amount.toFixed(8));

const nowIso = (): string => new Date().toISOString();

const normalizeNetwork = (value?: string | null): WalletNetwork => {
  const normalized = String(value || walletConfig.chainName || 'sidra').trim().toLowerCase();
  if (supportedWalletNetworks.includes(normalized as WalletNetwork)) {
    return normalized as WalletNetwork;
  }

  throw new Error(`Unsupported network: ${value || 'unknown'}. Allowed: ${supportedWalletNetworks.join(', ')}`);
};

const maybeDecryptAddress = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const parts = String(value).split(':');
  if (parts.length !== 3) {
    return String(value);
  }

  try {
    return decryptText(String(value));
  } catch {
    return String(value);
  }
};

const writeAuditLog = async (input: {
  actorUserId?: string | null;
  action: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> => {
  try {
    const supabase = createServerClient();
    await supabase.from('wallet_audit_logs').insert({
      actor_user_id: input.actorUserId || null,
      action: input.action,
      target_id: input.targetId || null,
      details: input.details || {},
    });
  } catch {
    // best-effort audit logging
  }
};

/**
 * Fetch the current withdrawal gas fee from the DB (admin-configurable).
 * Falls back to calcFee(amount) using config if DB value is not set.
 */
const getWithdrawalGasFee = async (amount: number): Promise<number> => {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await (supabase as any)
      .from('wallet_settings')
      .select('value')
      .eq('key', 'withdrawal_gas_fee_bps')
      .maybeSingle();
    const row = result?.data as { value: string } | null;
    if (row?.value !== undefined && row.value !== null) {
      const bps = Number(row.value);
      if (Number.isFinite(bps) && bps >= 0) {
        return Number(((amount * bps) / 10000).toFixed(8));
      }
    }
  } catch {
    // fall through to default
  }
  // Default: use config-based fee
  return calcFee(amount);
};

/**
 * Read the current gas fee BPS from DB (used by admin API).
 */
export const getGasFeeBps = async (): Promise<number> => {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await (supabase as any)
      .from('wallet_settings')
      .select('value')
      .eq('key', 'withdrawal_gas_fee_bps')
      .maybeSingle();
    const row = result?.data as { value: string } | null;
    if (row?.value !== undefined && row.value !== null) {
      const bps = Number(row.value);
      if (Number.isFinite(bps) && bps >= 0) return bps;
    }
  } catch {}
  return walletConfig.feeBps; // fall back to env-configured BPS
};

/**
 * Update the gas fee BPS in DB (used by admin API).
 */
export const setGasFeeBps = async (bps: number): Promise<void> => {
  const supabase = createServerClient();
  await (supabase as any)
    .from('wallet_settings')
    .upsert({ key: 'withdrawal_gas_fee_bps', value: String(bps), updated_at: new Date().toISOString() }, { onConflict: 'key' });
};

const getProvider = (network: WalletNetwork): ethers.JsonRpcProvider => {
  const rpcUrl = walletConfig.rpcUrls[network] || (network === 'sidra' ? walletConfig.rpcUrl : '');
  if (!rpcUrl) {
    throw new Error(`RPC URL is not configured for network: ${network}`);
  }

  return new ethers.JsonRpcProvider(rpcUrl);
};

const getSigner = (network: WalletNetwork): ethers.Wallet => {
  let signerPrivateKey = walletConfig.signerPrivateKeys?.[network] || walletConfig.signerPrivateKey;

  if (walletConfig.signerPrivateKeyEncrypted) {
    try {
      signerPrivateKey = decryptText(walletConfig.signerPrivateKeyEncrypted);
    } catch {
      throw new Error('WALLET_SIGNER_PRIVATE_KEY_ENCRYPTED could not be decrypted');
    }
  }

  if (!signerPrivateKey) {
    throw new Error(`Hot wallet private key is not configured for network: ${network}`);
  }

  return new ethers.Wallet(signerPrivateKey, getProvider(network));
};

const sweepDepositToHotWallet = async (input: {
  depositAddressId: string;
  userId: string;
  depositAddress: string;
  amount: number;
  network: WalletNetwork;
  sourceTxHash: string;
}) => {
  const { userId, depositAddress, amount, network, sourceTxHash } = input;
  const hotWalletAddress = (await getSigner(network).getAddress()).toLowerCase();
  const sourceAddress = String(depositAddress || '').toLowerCase();

  // Skip if deposit address is the hot wallet itself
  if (sourceAddress === hotWalletAddress) {
    return { status: 'skipped' as const, reason: 'Deposit address is the hot wallet' };
  }

  // Load the encrypted private key from the deposit address record
  const supabase = createServerClient();
  const { data: addrRecord } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, encrypted_private_key, swept_at')
    .eq('id', input.depositAddressId)
    .maybeSingle();

  if (!addrRecord?.encrypted_private_key) {
    await writeAuditLog({
      actorUserId: userId,
      action: 'wallet.deposit.sweep_skipped',
      targetId: sourceTxHash,
      details: {
        depositAddressId: input.depositAddressId,
        from: sourceAddress,
        to: hotWalletAddress,
        amount,
        network,
        reason: 'No encrypted private key stored for this deposit address',
      },
    });
    return { status: 'skipped' as const, reason: 'No private key available for sweep' };
  }

  try {
    const provider = getProvider(network);
    const depositPrivateKey = decryptText(addrRecord.encrypted_private_key);
    const depositSigner = new ethers.Wallet(depositPrivateKey, provider);

    // Check balance on the deposit address
    const balance = await provider.getBalance(sourceAddress);
    if (balance === 0n) {
      return { status: 'skipped' as const, reason: 'Zero balance on deposit address' };
    }

    // Estimate gas cost and leave enough for the sweep tx
    const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('5', 'gwei');
    const gasLimit = 21000n;
    const gasCost = gasPrice * gasLimit;

    if (balance <= gasCost) {
      console.log(`[sweep] Balance ${ethers.formatEther(balance)} too low to cover gas on ${sourceAddress}`);
      return { status: 'skipped' as const, reason: 'Balance too low to cover gas' };
    }

    const sweepAmount = balance - gasCost;

    console.log(`[sweep] Sweeping ${ethers.formatEther(sweepAmount)} from ${sourceAddress} to hot wallet ${hotWalletAddress} on ${network}`);

    const tx = await depositSigner.sendTransaction({
      to: hotWalletAddress,
      value: sweepAmount,
      gasLimit,
      gasPrice,
    });

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) {
      throw new Error('Sweep transaction reverted on-chain');
    }

    console.log(`[sweep] Success: ${tx.hash} — ${ethers.formatEther(sweepAmount)} swept to hot wallet`);

    // Update deposit address record with sweep info
    await supabase
      .from('wallet_deposit_addresses')
      .update({ swept_at: nowIso(), sweep_tx_hash: tx.hash })
      .eq('id', input.depositAddressId);

    await writeAuditLog({
      actorUserId: userId,
      action: 'wallet.deposit.swept',
      targetId: tx.hash,
      details: {
        depositAddressId: input.depositAddressId,
        sourceTxHash,
        from: sourceAddress,
        to: hotWalletAddress,
        amount: Number(ethers.formatEther(sweepAmount)),
        network,
      },
    });

    return { status: 'success' as const, txHash: tx.hash, amount: Number(ethers.formatEther(sweepAmount)) };
  } catch (sweepErr: any) {
    console.error(`[sweep] Failed for ${sourceAddress}: ${sweepErr?.message || 'unknown'}`);
    await writeAuditLog({
      actorUserId: userId,
      action: 'wallet.deposit.sweep_failed',
      targetId: sourceTxHash,
      details: {
        depositAddressId: input.depositAddressId,
        from: sourceAddress,
        to: hotWalletAddress,
        amount,
        network,
        error: sweepErr?.message || 'unknown',
      },
    });
    return { status: 'failed' as const, error: sweepErr?.message || 'Sweep failed' };
  }
};

const getUserByUsername = async (username: string) => {
  const supabase = createServerClient();
  const normalized = username.trim().toLowerCase();

  // Try exact username match first (case-insensitive)
  const { data: byUsername, error: usernameError } = await supabase
    .from('users')
    .select('id, username, full_name, email')
    .ilike('username', normalized)
    .limit(1)
    .maybeSingle();

  if (usernameError) {
    throw new Error(`Unable to verify recipient: ${usernameError.message}`);
  }

  if (byUsername) return byUsername;

  // Fall back to exact email match (case-insensitive)
  const { data: byEmail, error: emailError } = await supabase
    .from('users')
    .select('id, username, full_name, email')
    .ilike('email', normalized)
    .limit(1)
    .maybeSingle();

  if (emailError) {
    throw new Error(`Unable to verify recipient: ${emailError.message}`);
  }

  return byEmail;
};

export const estimateInternalFee = (amount: number) => {
  // Internal transfers between users are always free (zero fee)
  return {
    amount: roundAmount(amount),
    fee: 0,
    total: roundAmount(amount),
    feeBps: 0,
  };
};

export const verifyUsernameExists = async (username: string) => {
  const user = await getUserByUsername(username);
  return Boolean(user);
};

export const getInternalBalance = async (userId: string): Promise<WalletBalanceResult> => {
  const supabase = createServerClient();

  const { data: account, error } = await supabase
    .from('wallet_accounts')
    .select('balance, locked_balance, currency, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch wallet balance: ${error.message}`);
  }

  if (!account) {
    await supabase.from('wallet_accounts').insert({ user_id: userId });

    return {
      balance: 0,
      lockedBalance: 0,
      currency: walletConfig.currency,
      lastUpdated: nowIso(),
    };
  }

  return {
    balance: Number(account.balance || 0),
    lockedBalance: Number(account.locked_balance || 0),
    currency: account.currency || walletConfig.currency,
    lastUpdated: account.updated_at || nowIso(),
  };
};

export const provisionUserWallet = async (userId: string) => {
  const supabase = createServerClient();

  const { error: accountError } = await supabase
    .from('wallet_accounts')
    .upsert(
      {
        user_id: userId,
        balance: 0,
        locked_balance: 0,
        currency: walletConfig.currency,
      },
      { onConflict: 'user_id' }
    );

  if (accountError) {
    throw new Error(`Failed to provision wallet account: ${accountError.message}`);
  }

  const depositAddress = await getOrCreateDepositAddress(userId);

  await writeAuditLog({
    actorUserId: userId,
    action: 'wallet.user.provisioned',
    targetId: depositAddress.id,
    details: {
      address: depositAddress.address,
      network: depositAddress.network,
    },
  });

  return {
    accountCreated: true,
    address: depositAddress.address,
    network: depositAddress.network,
  };
};

export const getInternalTransactions = async (userId: string, limit = 20, offset = 0) => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, type, direction, amount, fee, status, tx_hash, to_address, from_address, description, created_at, counterparty_user_id, reference_id, retry_count, error_message')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
  }

  return (data || []).map((row) => {
    const toAddress = maybeDecryptAddress(row.to_address);
    const fromAddress = maybeDecryptAddress(row.from_address);
    return {
      ...row,
      to_address: toAddress,
      from_address: fromAddress,
    };
  });
};

export const internalTransfer = async (input: InternalTransferInput) => {
  const { senderUserId, recipientUsername, amount, description } = input;

  if (!recipientUsername || amount <= 0) {
    throw new Error('Invalid recipient or amount');
  }

  console.log(`[transfer] User ${senderUserId} initiating internal transfer of ${amount} to "${recipientUsername}"`);

  const recipient = await getUserByUsername(recipientUsername);

  if (!recipient) {
    console.warn(`[transfer] Recipient "${recipientUsername}" not found`);
    throw new Error('Recipient user not found');
  }

  if (recipient.id === senderUserId) {
    throw new Error('Self transfer is not allowed');
  }

  // Internal transfers between users are free — no fee charged
  const fee = 0;
  const referenceId = `itf_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('wallet_internal_transfer', {
    p_sender_id: senderUserId,
    p_recipient_id: recipient.id,
    p_amount: roundAmount(amount),
    p_fee: fee,
    p_description: description || null,
    p_reference_id: referenceId,
  });

  if (error || !data) {
    console.error(`[transfer] Internal transfer RPC failed: ${error?.message || 'unknown'}`);
    throw new Error(error?.message || 'Internal transfer failed');
  }

  console.log(`[transfer] Success: ${senderUserId} → ${recipient.id} amount=${roundAmount(amount)} fee=${fee} ref=${referenceId}`);

  await writeAuditLog({
    actorUserId: senderUserId,
    action: 'wallet.internal_transfer.success',
    targetId: String(data),
    details: {
      recipientId: recipient.id,
      recipientUsername: recipient.username,
      amount: roundAmount(amount),
      fee,
      referenceId,
    },
  });

  return {
    transactionId: data,
    recipient: recipient.username || recipient.full_name || recipient.email,
    amount: roundAmount(amount),
    fee,
    status: 'success' as const,
    referenceId,
    timestamp: nowIso(),
  };
};

const getUserWithdrawalLimits = async (userId: string) => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallet_limits')
    .select('daily_withdrawal_limit, single_withdrawal_limit')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch withdrawal limits: ${error.message}`);
  }

  return {
    daily: Number(data?.daily_withdrawal_limit ?? walletConfig.dailyWithdrawalLimit),
    single: Number(data?.single_withdrawal_limit ?? walletConfig.singleWithdrawalLimit),
  };
};

const getTodayWithdrawnAmount = async (userId: string): Promise<number> => {
  const supabase = createServerClient();

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('wallet_withdrawals')
    .select('amount, status')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .in('status', ['pending', 'processing', 'success']);

  if (error) {
    throw new Error(`Failed to check daily withdrawals: ${error.message}`);
  }

  return (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
};

const getLastWithdrawalTime = async (userId: string): Promise<Date | null> => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallet_withdrawals')
    .select('created_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing', 'success'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return new Date(data.created_at);
};

const WITHDRAWAL_COOLDOWN_SECONDS = 300; // 5 minutes between withdrawals

export const requestWithdrawal = async (input: WithdrawalInput) => {
  const { userId, amount, toAddress, description } = input;
  const network = normalizeNetwork(input.network);

  const normalizedToAddress = String(toAddress || '').trim().toLowerCase();

  if (!ethers.isAddress(normalizedToAddress)) {
    throw new Error('Invalid destination wallet address');
  }

  if (!Number.isFinite(amount) || amount < walletConfig.minWithdrawal) {
    throw new Error(`Minimum withdrawal is ${walletConfig.minWithdrawal} ${walletConfig.currency}`);
  }

  const limits = await getUserWithdrawalLimits(userId);

  if (amount > limits.single) {
    throw new Error(`Single withdrawal limit exceeded (${limits.single} ${walletConfig.currency})`);
  }

  const withdrawnToday = await getTodayWithdrawnAmount(userId);

  if (withdrawnToday + amount > limits.daily) {
    throw new Error(`Daily withdrawal limit exceeded (${limits.daily} ${walletConfig.currency})`);
  }

  // Rate limiting: enforce cooldown between withdrawals
  const lastWithdrawalTime = await getLastWithdrawalTime(userId);
  if (lastWithdrawalTime) {
    const secondsSinceLast = (Date.now() - lastWithdrawalTime.getTime()) / 1000;
    if (secondsSinceLast < WITHDRAWAL_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(WITHDRAWAL_COOLDOWN_SECONDS - secondsSinceLast);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting another withdrawal`);
    }
  }

  console.log(`[withdrawal] User ${userId} requesting ${amount} ${walletConfig.currency} to ${normalizedToAddress} on ${network}`);

  // Gas fee for blockchain withdrawals — loaded dynamically from DB (admin-configurable)
  const fee = await getWithdrawalGasFee(amount);
  const encryptedAddress = encryptText(normalizedToAddress);
  const supabase = createServerClient();
  const referenceId = `wdr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const { data, error } = await supabase.rpc('wallet_create_withdrawal', {
    p_user_id: userId,
    p_amount: roundAmount(amount),
    p_fee: fee,
    p_to_address: encryptedAddress,
    p_network: network,
    p_description: description || null,
    p_reference_id: referenceId,
  });

  if (error || !data) {
    throw new Error(error?.message || 'Unable to create withdrawal request');
  }

  const payload = data as { withdrawal_id: string; transaction_id: string };

  const { error: metadataError } = await supabase
    .from('wallet_transactions')
    .update({
      metadata: {
        encrypted_to_address: encryptedAddress,
        queued_at: nowIso(),
      },
    })
    .eq('id', payload.transaction_id);

  if (metadataError) {
    throw new Error(`Withdrawal queued but metadata update failed: ${metadataError.message}`);
  }

  await writeAuditLog({
    actorUserId: userId,
    action: 'wallet.withdrawal.queued',
    targetId: payload.withdrawal_id,
    details: {
      transactionId: payload.transaction_id,
      amount: roundAmount(amount),
      fee,
      network,
      referenceId,
    },
  });

  // Auto-process: attempt immediate on-chain broadcast (best-effort)
  try {
    console.log(`[withdrawal] Auto-processing withdrawal ${payload.withdrawal_id} on ${network}`);
    const supabaseForProcess = createServerClient();
    const { data: freshWithdrawal } = await supabaseForProcess
      .from('wallet_withdrawals')
      .select('id, user_id, amount, fee, to_address, network, status, attempts, next_retry_at, wallet_transaction_id')
      .eq('id', payload.withdrawal_id)
      .single();

    if (freshWithdrawal && freshWithdrawal.status === 'pending') {
      const processResult = await processSingleWithdrawal(freshWithdrawal);
      console.log(`[withdrawal] Auto-process result for ${payload.withdrawal_id}: ${processResult.status}`);
    }
  } catch (autoProcessError: any) {
    // Non-fatal: the periodic processor will pick it up
    console.warn(`[withdrawal] Auto-process failed for ${payload.withdrawal_id}: ${autoProcessError?.message || 'unknown'}`);
  }

  return {
    withdrawalId: payload.withdrawal_id,
    transactionId: payload.transaction_id,
    amount: roundAmount(amount),
    fee,
    network,
    status: 'pending' as const,
    referenceId,
    createdAt: nowIso(),
  };
};

const markWithdrawalSuccess = async (withdrawal: any, txHash: string) => {
  const supabase = createServerClient();

  await supabase
    .from('wallet_withdrawals')
    .update({
      status: 'success',
      tx_hash: txHash,
      updated_at: nowIso(),
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
          confirmed_at: nowIso(),
        },
      })
      .eq('id', withdrawal.wallet_transaction_id);
  }
};

const refundFailedWithdrawal = async (withdrawal: any, reason: string) => {
  console.log(`[withdrawal] Refunding failed withdrawal ${withdrawal.id}: ${Number(withdrawal.amount || 0) + Number(withdrawal.fee || 0)} ${walletConfig.currency} to user ${withdrawal.user_id}`);
  const supabase = createServerClient();

  const { data: account, error: accountError } = await supabase
    .from('wallet_accounts')
    .select('balance')
    .eq('user_id', withdrawal.user_id)
    .maybeSingle();

  if (accountError) {
    throw new Error(`Failed to fetch account for refund: ${accountError.message}`);
  }

  await supabase
    .from('wallet_accounts')
    .update({ balance: Number(account?.balance || 0) + Number(withdrawal.amount || 0) + Number(withdrawal.fee || 0) })
    .eq('user_id', withdrawal.user_id);

  await supabase.from('wallet_transactions').insert({
    user_id: withdrawal.user_id,
    type: 'adjustment',
    direction: 'credit',
    amount: Number(withdrawal.amount || 0) + Number(withdrawal.fee || 0),
    fee: 0,
    status: 'success',
    network: 'internal',
    description: 'Automatic refund for failed withdrawal',
    metadata: {
      source_withdrawal_id: withdrawal.id,
      reason,
    },
  });
};

const markWithdrawalFailed = async (withdrawal: any, errorMessage: string) => {
  const supabase = createServerClient();
  const attempts = Number(withdrawal.attempts || 0) + 1;
  const shouldRetry = attempts < walletConfig.maxRetryAttempts;
  const nextRetry = shouldRetry
    ? new Date(Date.now() + walletConfig.retryDelayMinutes * 60 * 1000).toISOString()
    : null;

  await supabase
    .from('wallet_withdrawals')
    .update({
      attempts,
      status: 'failed',
      last_error: errorMessage,
      next_retry_at: nextRetry,
      updated_at: nowIso(),
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

  if (!shouldRetry) {
    await refundFailedWithdrawal(withdrawal, errorMessage);
  }
};

const processSingleWithdrawal = async (withdrawal: any) => {
  const withdrawalNetwork = normalizeNetwork(withdrawal.network);
  console.log(`[withdrawal] Processing ${withdrawal.id} — ${withdrawal.amount} ${walletConfig.currency} to ${withdrawal.to_address?.slice(0, 20)}... on ${withdrawalNetwork} (attempt ${(withdrawal.attempts || 0) + 1})`);
  const signer = getSigner(withdrawalNetwork);
  const destinationAddress = maybeDecryptAddress(withdrawal.to_address);

  if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
    await markWithdrawalFailed(withdrawal, 'Invalid encrypted destination address');
    await writeAuditLog({
      actorUserId: withdrawal.user_id,
      action: 'wallet.withdrawal.failed',
      targetId: withdrawal.id,
      details: {
        reason: 'Invalid encrypted destination address',
      },
    });

    return {
      withdrawalId: withdrawal.id,
      status: 'failed',
      error: 'Invalid encrypted destination address',
    };
  }

  // Check hot wallet balance before sending
  try {
    const provider = getProvider(withdrawalNetwork);
    const hotWalletBalance = await provider.getBalance(await signer.getAddress());
    const requiredAmount = ethers.parseEther(String(withdrawal.amount));
    const gasEstimate = ethers.parseUnits('5', 'gwei') * 21000n;

    if (hotWalletBalance < requiredAmount + gasEstimate) {
      const balanceStr = ethers.formatEther(hotWalletBalance);
      const msg = `Hot wallet insufficient balance: ${balanceStr} < ${withdrawal.amount} + gas on ${withdrawalNetwork}`;
      console.error(`[withdrawal] ${msg}`);
      await markWithdrawalFailed(withdrawal, msg);
      await writeAuditLog({
        actorUserId: withdrawal.user_id,
        action: 'wallet.withdrawal.failed',
        targetId: withdrawal.id,
        details: {
          reason: 'Hot wallet insufficient balance',
          hotWalletBalance: balanceStr,
          requiredAmount: String(withdrawal.amount),
          network: withdrawalNetwork,
        },
      });
      return { withdrawalId: withdrawal.id, status: 'failed', error: msg };
    }
  } catch (balanceErr: any) {
    console.warn(`[withdrawal] Could not check hot wallet balance: ${balanceErr?.message}`);
    // Continue anyway — the sendTransaction will fail if balance is truly insufficient
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

    console.log(`[withdrawal] On-chain success: ${withdrawal.id} txHash=${tx.hash}`);
    await markWithdrawalSuccess(withdrawal, tx.hash);
    await writeAuditLog({
      actorUserId: withdrawal.user_id,
      action: 'wallet.withdrawal.success',
      targetId: withdrawal.id,
      details: {
        txHash: tx.hash,
        amount: Number(withdrawal.amount || 0),
        network: withdrawalNetwork,
      },
    });

    return {
      withdrawalId: withdrawal.id,
      status: 'success',
      txHash: tx.hash,
    };
  } catch (error: any) {
    console.error(`[withdrawal] On-chain failed for ${withdrawal.id}: ${error?.message || 'unknown'}`);
    await markWithdrawalFailed(withdrawal, error?.message || 'Withdrawal broadcast failed');
    await writeAuditLog({
      actorUserId: withdrawal.user_id,
      action: 'wallet.withdrawal.failed',
      targetId: withdrawal.id,
      details: {
        reason: error?.message || 'Withdrawal broadcast failed',
        attempts: Number(withdrawal.attempts || 0) + 1,
        network: withdrawalNetwork,
      },
    });

    return {
      withdrawalId: withdrawal.id,
      status: 'failed',
      error: error?.message || 'Withdrawal broadcast failed',
    };
  }
};

export const processPendingWithdrawals = async (options?: { onlyFailed?: boolean; limit?: number }) => {
  const supabase = createServerClient();
  const limit = Math.max(1, Math.min(50, options?.limit || 10));
  const now = nowIso();

  const statuses = options?.onlyFailed ? ['failed' as const] : ['pending' as const, 'failed' as const];

  const { data: withdrawals, error } = await supabase
    .from('wallet_withdrawals')
    .select('id, user_id, amount, fee, to_address, network, status, attempts, next_retry_at, wallet_transaction_id')
    .in('status', statuses)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load withdrawals: ${error.message}`);
  }

  console.log(`[withdrawal] Processing batch: ${(withdrawals || []).length} withdrawal(s) found`);

  const results = [];

  for (const withdrawal of withdrawals || []) {
    const result = await processSingleWithdrawal(withdrawal);
    results.push(result);
  }

  return {
    processed: results.length,
    success: results.filter((item) => item.status === 'success').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results,
  };
};

export const getOrCreateDepositAddress = async (userId: string) => {
  const supabase = createServerClient();

  const { data: existing, error: existingError } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, address, network, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load deposit address: ${existingError.message}`);
  }

  if (existing) {
    return existing;
  }
  const generatedWallet = ethers.Wallet.createRandom();
  const encryptedPrivateKey = encryptText(generatedWallet.privateKey);

  const { data: created, error: createError } = await supabase
    .from('wallet_deposit_addresses')
    .insert({
      user_id: userId,
      network: walletConfig.chainName,
      address: generatedWallet.address.toLowerCase(),
      encrypted_private_key: encryptedPrivateKey,
      is_active: true,
    })
    .select('id, address, network, created_at')
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create deposit address: ${createError?.message || 'Unknown error'}`);
  }

  await writeAuditLog({
    actorUserId: userId,
    action: 'wallet.deposit_address.created',
    targetId: created.id,
    details: {
      network: created.network,
    },
  });

  return created;
};

const safeGetBlock = async (provider: ethers.JsonRpcProvider, blockNumber: number) => {
  try {
    const block = await provider.getBlock(blockNumber, true);
    return block;
  } catch (err: any) {
    console.error(`[syncDeposits] Failed to fetch block ${blockNumber}:`, err?.message || err);
    return null;
  }
};

export const syncDeposits = async (options?: { maxBlocks?: number; network?: WalletNetwork }) => {
  const supabase = createServerClient();
  const network = normalizeNetwork(options?.network);
  const provider = getProvider(network);

  const { data: addresses, error: addressError } = await supabase
    .from('wallet_deposit_addresses')
    .select('id, user_id, address, network, last_checked_block')
    .eq('is_active', true)
    .eq('network', network);

  if (addressError) {
    throw new Error(`Failed to load deposit addresses: ${addressError.message}`);
  }

  if (!addresses || addresses.length === 0) {
    console.log('[syncDeposits] No active deposit addresses found for network:', network);
    return { scannedBlocks: 0, credited: 0, matches: 0 };
  }

  console.log(`[syncDeposits] Scanning ${addresses.length} deposit addresses on ${network}`);

  const byAddress = new Map<string, any>();
  for (const row of addresses) {
    byAddress.set(String(row.address).toLowerCase(), row);
  }

  let latestBlock: number;
  try {
    latestBlock = await provider.getBlockNumber();
    console.log(`[syncDeposits] RPC connected to ${network} — latest block: ${latestBlock}`);
  } catch (rpcErr: any) {
    console.error(`[syncDeposits] RPC CONNECTION FAILED for ${network}:`, rpcErr?.message || rpcErr);
    throw new Error(`RPC CONNECTION FAILED for ${network}: ${rpcErr?.message || 'unknown error'}`);
  }

  const maxBlocks = Math.max(10, Math.min(2000, options?.maxBlocks || walletConfig.maxDepositBlocksPerSync));

  const trackedBlocks = addresses
    .map((row) => Number(row.last_checked_block || 0))
    .filter((value) => value > 0);

  const minTracked = trackedBlocks.length > 0 ? Math.min(...trackedBlocks) : 0;

  const fallbackFrom = Math.max(0, latestBlock - maxBlocks);
  const startBlock = minTracked > 0 ? Math.max(minTracked + 1, fallbackFrom) : fallbackFrom;

  let credited = 0;
  let matches = 0;
  let scannedBlocks = 0;

  for (let blockNumber = startBlock; blockNumber <= latestBlock; blockNumber += 1) {
    const block = await safeGetBlock(provider, blockNumber);

    if (!block || !block.transactions?.length) {
      scannedBlocks += 1;
      continue;
    }

    // ethers v6: block.prefetchedTransactions contains full TransactionResponse objects
    // block.transactions only returns string hashes — we must use prefetchedTransactions
    let fullTxs: ethers.TransactionResponse[] = [];
    try {
      fullTxs = block.prefetchedTransactions || [];
    } catch {
      // Fallback: if prefetchedTransactions is not available, fetch individually
      for (const txHash of block.transactions) {
        try {
          const tx = await provider.getTransaction(txHash);
          if (tx) fullTxs.push(tx);
        } catch {
          // skip individual tx fetch failures
        }
      }
    }

    for (const tx of fullTxs) {
      const to = tx.to?.toLowerCase();
      if (!to || !byAddress.has(to) || tx.value <= 0n) {
        continue;
      }

      matches += 1;
      const depositOwner = byAddress.get(to);
      console.log(`[syncDeposits] Match found: tx=${tx.hash} to=${to} value=${ethers.formatEther(tx.value)} block=${blockNumber}`);

      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt || receipt.status !== 1) {
        continue;
      }

      const confirmations = latestBlock - Number(receipt.blockNumber) + 1;
      if (confirmations < walletConfig.minConfirmations) {
        continue;
      }

      const amount = Number(ethers.formatEther(tx.value));

      try {
        const { error: creditError } = await supabase.rpc('wallet_credit_deposit', {
          p_user_id: depositOwner.user_id,
          p_amount: roundAmount(amount),
          p_tx_hash: tx.hash,
          p_network: network,
          p_deposit_address: to,
          p_confirmations: confirmations,
          p_metadata: {
            block_number: Number(receipt.blockNumber),
            from_address: tx.from?.toLowerCase(),
          },
        });

        if (!creditError) {
          credited += 1;
          console.log(`[syncDeposits] Deposit credited: user=${depositOwner.user_id} amount=${roundAmount(amount)} tx=${tx.hash}`);
          await sweepDepositToHotWallet({
            depositAddressId: depositOwner.id,
            userId: depositOwner.user_id,
            depositAddress: to,
            amount: roundAmount(amount),
            network,
            sourceTxHash: tx.hash,
          });

          await writeAuditLog({
            actorUserId: depositOwner.user_id,
            action: 'wallet.deposit.credited',
            targetId: tx.hash,
            details: {
              amount: roundAmount(amount),
              address: to,
              confirmations,
              blockNumber: Number(receipt.blockNumber),
            },
          });
        }
      } catch (depositError: any) {
        console.log(`[syncDeposits] Skipped tx=${tx.hash}: ${depositError?.message || 'duplicate or race condition'}`);
      }
    }

    scannedBlocks += 1;
  }

  for (const row of addresses) {
    await supabase
      .from('wallet_deposit_addresses')
      .update({ last_checked_block: latestBlock })
      .eq('id', row.id);
  }

  console.log(`[syncDeposits] Done: network=${network} blocks=${scannedBlocks} matches=${matches} credited=${credited} range=${startBlock}-${latestBlock}`);

  return {
    network,
    scannedBlocks,
    credited,
    matches,
    latestBlock,
    fromBlock: startBlock,
  };
};

export const getWalletMonitoring = async () => {
  const supabase = createServerClient();

  const [
    pendingWithdrawals,
    failedWithdrawals,
    recentTransactions,
    accountStats,
  ] = await Promise.all([
    supabase.from('wallet_withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('wallet_withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase
      .from('wallet_transactions')
      .select('id, user_id, type, direction, amount, status, created_at, tx_hash, error_message')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('wallet_accounts')
      .select('id, balance', { count: 'exact' }),
  ]);

  if (recentTransactions.error) {
    throw new Error(`Failed to load monitoring data: ${recentTransactions.error.message}`);
  }

  const totalPlatformBalance = (accountStats.data || []).reduce(
    (sum, row) => sum + Number(row.balance || 0),
    0
  );

  return {
    summary: {
      pendingWithdrawals: pendingWithdrawals.count || 0,
      failedWithdrawals: failedWithdrawals.count || 0,
      walletAccounts: accountStats.count || 0,
      totalPlatformBalance: roundAmount(totalPlatformBalance),
    },
    recentTransactions: recentTransactions.data || [],
    generatedAt: nowIso(),
  };
};
