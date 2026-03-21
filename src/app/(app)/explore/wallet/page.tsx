'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Wallet, History, TrendingUp } from 'lucide-react';
import { TransferForm } from '@/components/wallet/TransferForm';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { SDALogo } from '@/components/wallet/SDALogo';
import { getInternalBalance } from '@/lib/internalTransfer';
import { supabase } from '@/lib/supabase';

export default function WalletPage() {
  const [balance, setBalance] = useState<string | null>(null);
  const [activeTransferType, setActiveTransferType] = useState<'internal'>('internal');
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token from Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setAuthToken(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch balance when auth token is available
  useEffect(() => {
    if (authToken) {
      refreshBalance();
    }
  }, [authToken]);

  const refreshBalance = useCallback(async () => {
    if (!authToken) return;

    setIsRefreshingBalance(true);
    try {
      const internalBalance = await getInternalBalance(authToken);
      setBalance(internalBalance.balance.toString());
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [authToken]);

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
            Send and receive SIDRA tokens instantly. Manage your internal transfers in one place.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {authToken ? (
          <>
            {/* Balance Card */}
            <motion.div variants={itemVariants}>
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
                <div className="text-3xl md:text-4xl font-bold text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                  {balance ? parseFloat(balance).toFixed(4) : '-'}
                  <SDALogo size="md" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Platform balance
                </p>
                <button
                  onClick={refreshBalance}
                  disabled={isRefreshingBalance}
                  className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                >
                  {isRefreshingBalance ? 'Refreshing...' : 'Refresh'}
                </button>
              </motion.div>
            </motion.div>

            {/* Transfer Form */}
            <motion.div variants={itemVariants}>
              <TransferForm
                walletAddress={null}
                transferType="internal"
                authToken={authToken}
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

              <TransactionHistory
                walletAddress={null}
                transactionType="internal"
                authToken={authToken}
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
        ) : (
          <motion.div variants={itemVariants} className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access your wallet.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
