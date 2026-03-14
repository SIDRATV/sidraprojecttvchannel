'use client';

import { ReactNode } from 'react';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Create wagmiConfig
const metadata = {
  name: 'Sidra TV',
  description: 'Premium Islamic Media Streaming with Web3',
  url: 'https://sidraprojecttvchannel.vercel.app',
  icons: ['https://sidraprojecttvchannel.vercel.app/logo.png']
};

const ethersConfig = defaultConfig({
  metadata,
  defaultChainId: 1,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.public.2xlabs.com'
});

// 3. Create modal
createWeb3Modal({
  ethersConfig,
  chains: [
    {
      chainId: 1,
      name: 'Ethereum',
      currency: 'ETH',
      explorerUrl: 'https://etherscan.io',
      rpcUrl: 'https://eth.public.2xlabs.com'
    }
  ],
  projectId,
  enableAnalytics: true
});

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
