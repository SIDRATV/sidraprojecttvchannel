'use client';

import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import { BrowserProvider, Contract } from 'ethers';

export function useWeb3Provider() {
  const { walletProvider } = useWeb3ModalProvider();

  const getSigner = async () => {
    if (!walletProvider) {
      throw new Error('Wallet not connected. Please connect using WalletConnect.');
    }
    
    const provider = new BrowserProvider(walletProvider);
    return provider.getSigner();
  };

  const getProvider = () => {
    if (!walletProvider) {
      throw new Error('Wallet not connected');
    }
    return new BrowserProvider(walletProvider);
  };

  return {
    walletProvider,
    getSigner,
    getProvider,
    isConnected: !!walletProvider,
  };
}
