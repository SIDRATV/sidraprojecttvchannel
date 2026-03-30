import type { WalletNetwork } from './types';

export interface ChainConfig {
  network: WalletNetwork;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  /** Number of confirmations required before crediting deposit */
  minConfirmations: number;
  /** Maximum blocks to scan per sync cycle */
  maxBlocksPerScan: number;
}

export const CHAIN_CONFIGS: Record<WalletNetwork, ChainConfig> = {
  sidra: {
    network: 'sidra',
    chainId: 97453,
    name: 'Sidra Chain',
    symbol: 'SIDRA',
    decimals: 18,
    rpcUrl: process.env.RPC_URL_SIDRA
      || process.env.WALLET_RPC_URL_SIDRA
      || process.env.WALLET_RPC_URL
      || process.env.NEXT_PUBLIC_SIDRA_RPC_URL
      || 'https://node.sidrachain.com',
    explorerUrl: 'https://ledger.sidrachain.com',
    minConfirmations: 3,
    maxBlocksPerScan: 500,
  },
  bsc: {
    network: 'bsc',
    chainId: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: process.env.RPC_URL_BSC
      || process.env.WALLET_RPC_URL_BSC
      || 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    minConfirmations: 3,
    maxBlocksPerScan: 100,
  },
};

/**
 * Get the chain config for a given network. Throws if RPC URL is missing.
 */
export const getChainConfig = (network: WalletNetwork): ChainConfig => {
  const config = CHAIN_CONFIGS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  if (!config.rpcUrl) {
    throw new Error(`RPC URL not configured for network: ${network}`);
  }
  return config;
};

/**
 * Get explorer URL for a transaction hash
 */
export const getExplorerTxUrl = (network: WalletNetwork, txHash: string): string => {
  const config = CHAIN_CONFIGS[network];
  return `${config.explorerUrl}/tx/${txHash}`;
};

/**
 * Get all networks that have RPC URLs configured
 */
export const getActiveNetworks = (): WalletNetwork[] => {
  return (Object.keys(CHAIN_CONFIGS) as WalletNetwork[]).filter(
    (network) => !!CHAIN_CONFIGS[network].rpcUrl
  );
};
