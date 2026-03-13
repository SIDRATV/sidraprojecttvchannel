'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Copy, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  connectMetaMask,
  getCurrentAccount,
  getCurrentChainId,
  onAccountChange,
  onChainChange,
  SIDRA_CHAIN_CONFIG,
} from '@/lib/web3-provider';

interface WalletConnectProps {
  onAccountChange?: (account: string | null) => void;
  onChainChange?: (chainId: number | null) => void;
}

export function WalletConnect({ onAccountChange: onAccountChangeCallback, onChainChange: onChainChangeCallback }: WalletConnectProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCorrectChain, setIsCorrectChain] = useState(false);

  // Initialize wallet on mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const currentAccount = await getCurrentAccount();
        const currentChainId = await getCurrentChainId();
        
        setAccount(currentAccount);
        setChainId(currentChainId);
        setIsCorrectChain(currentChainId === SIDRA_CHAIN_CONFIG.chainId);

        // Setup event listeners
        onAccountChange((accounts: string[]) => {
          const newAccount = accounts.length > 0 ? accounts[0] : null;
          setAccount(newAccount);
          onAccountChangeCallback?.(newAccount);
        });

        onChainChange((chainIdHex: string) => {
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
          setIsCorrectChain(newChainId === SIDRA_CHAIN_CONFIG.chainId);
          onChainChangeCallback?.(newChainId);
        });
      } catch (err) {
        console.error('Error initializing wallet:', err);
      }
    };

    initializeWallet();
  }, [onAccountChangeCallback, onChainChangeCallback]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const connectedAccount = await connectMetaMask();
      setAccount(connectedAccount);
      onAccountChangeCallback?.(connectedAccount);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to connect wallet';
      
      // Provide helpful message if MetaMask is not installed
      if (errorMessage.includes('MetaMask is not installed')) {
        errorMessage = 'MetaMask is not installed. Please install it from: https://metamask.io/download/';
      }
      
      setError(errorMessage);
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setError(null);
    onAccountChangeCallback?.(null);
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!account) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20 rounded-xl p-6 md:p-8"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-brand-500/10 p-4 rounded-full">
            <Wallet className="w-8 h-8 text-brand-500" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Connect MetaMask to start transferring SIDRA tokens
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error.includes('metamask.io') ? (
                  <>
                    <p>MetaMask is not installed.</p>
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Click here to download MetaMask
                    </a>
                  </>
                ) : (
                  error
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            Make sure MetaMask is installed and you have SidraChain configured
          </p>
        </div>
      </motion.div>
    );
  }

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
          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Account Info */}
        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Connected Account
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-sm font-medium text-gray-950 dark:text-white">
                {shortenAddress(account)}
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
