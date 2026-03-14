'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Wallet, History, TrendingUp, Zap } from 'lucide-react';
import {
  WalletConnect,
  TransferForm,
  TransactionHistory,
  NetworkStatus,
  BalanceCard,
  WalletSection,
  InfoCard,
} from '@/components/wallet';
import { SDALogo } from '@/components/wallet/SDALogo';
import { getBalance } from '@/lib/web3-provider';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';

export default function WalletPage() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [activeTransferType, setActiveTransferType] = useState<'onchain' | 'internal'>(
    'onchain'
  );
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { chainId, isConnected } = useWeb3ModalAccount();
  const isCorrectChain = chainId === 97453; // SidraChain ID

  // Get auth token from context or localStorage
  useEffect(() => {
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
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl opacity-20"
        />
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flexitems-center gap-2 px-4 py-2 mb-6 bg-blue-500/10 border border-blue-500/30 rounded-full backdrop-blur-sm"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Secure & Fast Transfers</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-white">Digital </span>
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Send and receive SDA tokens on SidraChain. Manage your on-chain and internal
            transfers with professional-grade security.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Network Status */}
        {isConnected && (
          <motion.div variants={itemVariants}>
            <NetworkStatus isConnected={isConnected} isCorrectChain={isCorrectChain} />
          </motion.div>
        )}

        {/* Wallet Connection Section */}
        <motion.div variants={itemVariants}>
          <WalletSection
            title="Connect Your Wallet"
            description="Link your Web3 wallet to start making on-chain transfers"
            icon={Wallet}
          >
            <WalletConnect
              onAccountChange={setConnectedAccount}
              onChainChange={() => {
                if (connectedAccount) {
                  refreshBalance();
                }
              }}
            />
          </WalletSection>
        </motion.div>

        {/* On-Chain Section */}
        {connectedAccount && (
          <motion.div variants={itemVariants}>
            <WalletSection
              title="On-Chain Transactions"
              description="Send SIDRA directly on the blockchain with security and speed"
              icon={TrendingUp}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <BalanceCard
                  title="On-Chain Balance"
                  balance={balance}
                  symbol="SDA"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="blue"
                  onRefresh={refreshBalance}
                  isRefreshing={isRefreshingBalance}
                  subtitle="Blockchain balance"
                />

                {/* Transfer Form */}
                <TransferForm
                  walletAddress={connectedAccount}
                  transferType="onchain"
                  onSuccess={handleTransferSuccess}
                />
              </div>

              {/* Transaction History */}
              <motion.div variants={itemVariants} className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <History className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Recent Transactions</h3>
                </div>
                <TransactionHistory
                  walletAddress={connectedAccount}
                  transactionType="onchain"
                  limit={10}
                />
              </motion.div>
            </WalletSection>
          </motion.div>
        )}

        {/* Internal Transfer Section */}
        <motion.div variants={itemVariants}>
          <WalletSection
            title="Internal Transfers"
            description="Send SDA to other platform users instantly"
            icon={Send}
          >
            {authToken ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <BalanceCard
                    title="Platform Balance"
                    balance="Coming Soon"
                    symbol="SDA"
                    icon={<Wallet className="w-6 h-6" />}
                    color="emerald"
                    subtitle="Internal wallet balance"
                  />

                  {/* Transfer Form */}
                  <TransferForm
                    walletAddress={null}
                    transferType="internal"
                    authToken={authToken}
                    onSuccess={handleTransferSuccess}
                  />
                </div>

                {/* Transaction History */}
                <motion.div variants={itemVariants} className="mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <History className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Transfer History</h3>
                  </div>
                  <TransactionHistory
                    walletAddress={null}
                    transactionType="internal"
                    authToken={authToken}
                    limit={10}
                  />
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 backdrop-blur-xl border border-blue-600/40 rounded-2xl p-8 text-center"
              >
                <p className="text-blue-300 text-lg font-medium">
                  📝 Please log in to your account to use internal transfers.
                </p>
              </motion.div>
            )}
          </WalletSection>
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants}>
          <div className="space-y-4">
            <InfoCard title="On-Chain Transfers" type="info">
              <p>
                • Send SIDRA directly on the blockchain using Web3 wallet
              </p>
              <p>
                • Transactions are permanent and secured by SidraChain
              </p>
              <p>
                • Small gas fees apply - check network status for latency
              </p>
            </InfoCard>

            <InfoCard title="Internal Transfers" type="success">
              <p>
                • Send SIDRA to other platform users instantly
              </p>
              <p>
                • No gas fees - completely free transfers
              </p>
              <p>
                • Transactions processed immediately on our servers
              </p>
            </InfoCard>

            <InfoCard title="Security Best Practices" type="warning">
              <p>
                ⚠️ Always verify recipient addresses before sending
              </p>
              <p>
                ⚠️ Keep your wallet secure and never share private keys
              </p>
              <p>
                ⚠️ Test with small amounts first when using new addresses
              </p>
            </InfoCard>

            <InfoCard title="Pro Tips" type="tip">
              <p>
                💡 Use internal transfers for quick transfers between users
              </p>
              <p>
                💡 On-chain transfers are blockchain-verified and permanent
              </p>
              <p>
                💡 Check network latency in the status card for optimal transactions
              </p>
            </InfoCard>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
