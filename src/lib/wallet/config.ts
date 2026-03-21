const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

import type { WalletNetwork } from './types';

export const supportedWalletNetworks = ['sidra', 'bsc'] as const;
export type { WalletNetwork };

const defaultNetwork = String(process.env.WALLET_CHAIN_NAME || 'sidra').toLowerCase();

const fallbackSidraRpc =
  process.env.RPC_URL_SIDRA ||
  process.env.WALLET_RPC_URL_SIDRA ||
  process.env.WALLET_RPC_URL ||
  process.env.NEXT_PUBLIC_SIDRA_RPC_URL ||
  '';

const fallbackBscRpc = process.env.RPC_URL_BSK || process.env.WALLET_RPC_URL_BSC || '';

export const walletConfig = {
  currency: process.env.WALLET_CURRENCY || 'SIDRA',
  chainName: supportedWalletNetworks.includes(defaultNetwork as WalletNetwork) ? defaultNetwork : 'sidra',
  rpcUrls: {
    sidra: fallbackSidraRpc,
    bsc: fallbackBscRpc,
  } as Record<WalletNetwork, string>,
  rpcUrl: fallbackSidraRpc,
  signerPrivateKeys: {
    sidra:
      process.env.HOT_WALLET_PRIVATE_KEY_SIDRA ||
      process.env.WALLET_SIGNER_PRIVATE_KEY_SIDRA ||
      process.env.WALLET_SIGNER_PRIVATE_KEY ||
      '',
    bsc:
      process.env.HOT_WALLET_PRIVATE_KEY_BSK ||
      process.env.WALLET_SIGNER_PRIVATE_KEY_BSC ||
      process.env.WALLET_SIGNER_PRIVATE_KEY ||
      '',
  } as Record<WalletNetwork, string>,
  signerPrivateKey: process.env.WALLET_SIGNER_PRIVATE_KEY || process.env.HOT_WALLET_PRIVATE_KEY_SIDRA || '',
  signerPrivateKeyEncrypted: process.env.WALLET_SIGNER_PRIVATE_KEY_ENCRYPTED || '',
  depositMnemonic: process.env.WALLET_DEPOSIT_MNEMONIC || '',
  depositDerivationPathPrefix: process.env.WALLET_DEPOSIT_DERIVATION_PREFIX || "m/44'/60'/0'/0/",
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.WALLET_ENCRYPTION_KEY || '',
  feeBps: toNumber(process.env.WALLET_INTERNAL_TRANSFER_FEE_BPS, 100),
  minWithdrawal: toNumber(process.env.WALLET_WITHDRAWAL_MIN, 0.01),
  singleWithdrawalLimit: toNumber(process.env.WALLET_WITHDRAWAL_SINGLE_LIMIT, 500),
  dailyWithdrawalLimit: toNumber(process.env.WALLET_WITHDRAWAL_DAILY_LIMIT, 1000),
  maxRetryAttempts: Math.max(0, Math.floor(toNumber(process.env.WALLET_WITHDRAWAL_MAX_RETRIES, 3))),
  retryDelayMinutes: Math.max(1, Math.floor(toNumber(process.env.WALLET_WITHDRAWAL_RETRY_DELAY_MINUTES, 10))),
  minConfirmations: Math.max(1, Math.floor(toNumber(process.env.WALLET_MIN_CONFIRMATIONS, 3))),
  maxDepositBlocksPerSync: Math.max(10, Math.floor(toNumber(process.env.WALLET_DEPOSIT_SYNC_BLOCKS, 250))),
  require2FA: String(process.env.WALLET_REQUIRE_2FA || 'false').toLowerCase() === 'true',
  master2FACode: process.env.WALLET_2FA_MASTER_CODE || '',
  adminApiKey: process.env.WALLET_ADMIN_API_KEY || process.env.CACHE_CONTROL_API_TOKEN || '',
};

export const calcFee = (amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Number(((amount * walletConfig.feeBps) / 10000).toFixed(8));
};
