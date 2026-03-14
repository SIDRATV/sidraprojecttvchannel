'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Copy, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import {
  SIDRA_CHAIN_CONFIG,
} from '@/lib/web3-provider';

interface WalletConnectProps {
  onAccountChange?: (account: string | null) => void;
  onChainChange?: (chainId: number | null) => void;
}

export function WalletConnect({ onAccountChange: onAccountChangeCallback, onChainChange: onChainChangeCallback }: WalletConnectProps) {
  const { open } = useWeb3Modal();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const [copied, setCopied] = useState(false);
  const [isCorrectChain, setIsCorrectChain] = useState(false);

  // Monitor connection changes
  useEffect(() => {
    if (isConnected && address) {
      onAccountChangeCallback?.(address);
    } else {
      onAccountChangeCallback?.(null);
    }
  }, [isConnected, address, onAccountChangeCallback]);

  // Monitor chain changes
  useEffect(() => {
    if (chainId) {
      setIsCorrectChain(chainId === SIDRA_CHAIN_CONFIG.chainId);
      onChainChangeCallback?.(chainId);
    }
  }, [chainId, onChainChangeCallback]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Not connected state
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6 md:p-8"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-3">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
              Connect Your Wallet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connect using WalletConnect to access on-chain features
            </p>
          </div>

          {/* Web3Modal Button with WalletConnect Logo */}
          <button
            onClick={() => open()}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {/* WalletConnect Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M7.5 12c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5-4.5-2.02-4.5-4.5z" />
            </svg>
            Connect with WalletConnect
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            Supports MetaMask, Trust Wallet, Coinbase, and 200+ other wallets
          </p>
        </div>
      </motion.div>
    );
  }

  // Connected state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 rounded-xl p-6 md:p-8"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Wallet Connected
            </span>
          </div>
          <button
            onClick={() => open()}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
            title="Disconnect wallet"
          >
            <LogOut className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Connected Account
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-sm font-medium text-gray-950 dark:text-white">
                {shortenAddress(address || '')}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                title="Copy address"
              >
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Copied to clipboard
              </p>
            )}
          </div>

          {/* Chain Info */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Network
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-gray-950 dark:text-white">
                {isCorrectChain ? SIDRA_CHAIN_CONFIG.chainName : 'Wrong Network'}
              </span>
              {!isCorrectChain && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                  Chain ID: {chainId}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isCorrectChain && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please switch to SidraChain Network (Chain ID: {SIDRA_CHAIN_CONFIG.chainId})
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
