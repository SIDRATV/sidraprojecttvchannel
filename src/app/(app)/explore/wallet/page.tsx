'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Wallet, History, TrendingUp } from 'lucide-react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { TransferForm } from '@/components/wallet/TransferForm';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { getBalance } from '@/lib/web3-provider';

export default function WalletPage() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [activeTransferType, setActiveTransferType] = useState<'onchain' | 'internal'>(
    'onchain'
  );
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token from context or localStorage
  useEffect(() => {
    // In a real app, get this from your auth provider
    const token = localStorage.getItem('auth_token');
    setAuthToken(token);
  }, []);

  // Fetch balance when account connects
  useEffect(() => {
    if (connectedAccount) {
      refreshBalance();
    }
  }, [connectedAccount]);

  const refreshBalance = useCallback(async () => {
    if (!connectedAccount) return;

    setIsRefreshingBalance(true);
    try {
      const newBalance = await getBalance(connectedAccount);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [connectedAccount]);

  const handleTransferSuccess = useCallback(
    (txHash: string) => {
      // Refresh balance after successful transfer
      setTimeout(() => {
        refreshBalance();
      }, 2000);
    },
    [refreshBalance]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen py-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gray-950 dark:text-white">Digital </span>
            <span className="text-gradient">Wallet</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Send and receive SIDRA tokens on SidraChain. Manage your on-chain and internal
            transfers in one place.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Wallet Connection Section */}
        <motion.div variants={itemVariants}>
          <WalletConnect
            onAccountChange={setConnectedAccount}
            onChainChange={() => {
              // Chain changed, may need to refresh
              if (connectedAccount) {
                refreshBalance();
              }
            }}
          />
        </motion.div>

        {connectedAccount && (
          <>
            {/* Balance Cards */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
              {/* On-Chain Balance */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    On-Chain Balance
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-950 dark:text-white mb-2">
                  {balance ? parseFloat(balance).toFixed(4) : '-'} SIDRA
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Blockchain balance
                </p>
                <button
                  onClick={refreshBalance}
                  disabled={isRefreshingBalance}
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  {isRefreshingBalance ? 'Refreshing...' : 'Refresh'}
                </button>
              </motion.div>

              {/* Internal Balance */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Internal Balance
                  </div>
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-950 dark:text-white mb-2">
                  - SIDRA
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Platform balance
                </p>
                <button
                  className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  Refresh
                </button>
              </motion.div>
            </motion.div>

            {/* Transfer Type Selection */}
            <motion.div variants={itemVariants} className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit">
              {[
                { id: 'onchain' as const, label: 'On-Chain Transfer', icon: Send },
                { id: 'internal' as const, label: 'Internal Transfer', icon: Send },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTransferType(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTransferType === id
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </motion.div>

            {/* Transfer Forms - Two Column Layout */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
              {/* On-Chain Transfer */}
              <TransferForm
                walletAddress={connectedAccount}
                transferType="onchain"
                onSuccess={handleTransferSuccess}
              />

              {/* Internal Transfer */}
              <TransferForm
                walletAddress={connectedAccount}
                transferType="internal"
                authToken={authToken || undefined}
                onSuccess={handleTransferSuccess}
              />
            </motion.div>

            {/* Transaction History */}
            <motion.div variants={itemVariants}>
              <div className="mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-brand-500" />
                <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
                  Recent Activity
                </h2>
              </div>

              {/* Tab Selection */}
              <div className="mb-4 flex gap-2">
                {[
                  { id: 'all', label: 'All Transactions' },
                  { id: 'onchain', label: 'On-Chain' },
                  { id: 'internal', label: 'Internal' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTransferType === 'onchain' && id === 'all'
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <TransactionHistory
                walletAddress={connectedAccount}
                transactionType="all"
                authToken={authToken || undefined}
                limit={10}
              />
            </motion.div>

            {/* Info Section */}
            <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-bold text-blue-950 dark:text-blue-200 mb-3">
                💡 Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>
                  • <strong>On-Chain Transfers:</strong> Send SIDRA directly on the blockchain. Transactions are
                  permanent and can take a few moments to confirm.
                </li>
                <li>
                  • <strong>Internal Transfers:</strong> Send SIDRA to other users on the platform.
                  Transactions are instant.
                </li>
                <li>
                  • <strong>Gas Fees:</strong> On-chain transfers require a small gas fee paid in SIDRA.
                </li>
                <li>
                  • <strong>Security:</strong> Always verify recipient addresses before sending funds.
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
