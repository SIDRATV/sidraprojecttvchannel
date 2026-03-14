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
  defaultChainId: 97453,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://node.sidrachain.com'
});

// 3. Create modal with SidraChain as primary network
createWeb3Modal({
  ethersConfig,
  chains: [
    {
      chainId: 97453,
      name: 'Sidra Chain',
      currency: 'SIDRA',
      explorerUrl: 'https://ledger.sidrachain.com',
      rpcUrl: 'https://node.sidrachain.com'
    },
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
