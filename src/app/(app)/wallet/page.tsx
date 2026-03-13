'use client';

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
        {/* Wallet Connection Section - Only for On-Chain */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-4">
            On-Chain Transactions
          </h2>
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

        {/* On-Chain Section */}
        {connectedAccount && (
          <motion.div variants={itemVariants}>
            <div className="grid md:grid-cols-2 gap-6">
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

              {/* On-Chain Transfer Form */}
              <TransferForm
                walletAddress={connectedAccount}
                transferType="onchain"
                onSuccess={handleTransferSuccess}
              />
            </div>

            {/* On-Chain Transaction History */}
            <motion.div variants={itemVariants} className="mt-8">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-brand-500" />
                <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                  On-Chain Transactions
                </h3>
              </div>
              <TransactionHistory
                walletAddress={connectedAccount}
                transactionType="onchain"
                limit={10}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Internal Transfer Section - No MetaMask needed */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-4">
            Internal Transfers
          </h2>
          {authToken ? (
            <div className="grid md:grid-cols-2 gap-6">
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

              {/* Internal Transfer Form */}
              <TransferForm
                walletAddress={null}
                transferType="internal"
                authToken={authToken}
                onSuccess={handleTransferSuccess}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
            >
              <p className="text-blue-800 dark:text-blue-300">
                Please log in to your account to use internal transfers.
              </p>
            </motion.div>
          )}

          {/* Internal Transaction History */}
          {authToken && (
            <motion.div variants={itemVariants} className="mt-8">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-brand-500" />
                <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                  Internal Transactions
                </h3>
              </div>
              <TransactionHistory
                walletAddress={null}
                transactionType="internal"
                authToken={authToken}
                limit={10}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-bold text-blue-950 dark:text-blue-200 mb-3">
            💡 Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>
              • <strong>On-Chain Transfers:</strong> Send SIDRA directly on the blockchain. Requires MetaMask. Transactions are
              permanent and can take a few moments to confirm.
            </li>
            <li>
              • <strong>Internal Transfers:</strong> Send SIDRA to other users on the platform. Only requires login.
              Transactions are instant and free.
            </li>
            <li>
              • <strong>Gas Fees:</strong> On-chain transfers require a small gas fee paid in SIDRA.
            </li>
            <li>
              • <strong>Security:</strong> Always verify recipient addresses before sending funds.
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
