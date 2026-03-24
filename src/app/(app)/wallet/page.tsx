'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Wallet,
  History,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Globe,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  TransferForm,
  TransactionHistory,
  BalanceCard,
  WalletSection,
  InfoCard,
} from '@/components/wallet';
import { WithdrawForm } from '@/components/wallet/WithdrawForm';
import { DepositAddress } from '@/components/wallet/DepositAddress';
import { SDALogo } from '@/components/wallet/SDALogo';
import { WalletErrorBoundary } from '@/components/wallet/WalletErrorBoundary';
import { getInternalBalance } from '@/lib/internalTransfer';
import { useAuth } from '@/hooks/useAuth';

type WalletMode = 'internal' | 'external';

export default function WalletPage() {
  // ── Auth from shared context (single getSession, no duplicates) ──
  const { user, session } = useAuth();
  const authToken = session?.access_token;

  const [balance, setBalance] = useState<string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [walletLoadError, setWalletLoadError] = useState<string | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode>('internal');

  // ── Load balance only when auth token is available ──
  const refreshBalance = useCallback(async () => {
    if (!authToken) return;
    setIsRefreshingBalance(true);
    setWalletLoadError(null);
    try {
      const internalBalance = await getInternalBalance(authToken);
      setBalance(internalBalance.balance.toString());
    } catch (error) {
      console.error('Error fetching balance:', error);
      const message = error instanceof Error ? error.message : 'Unknown wallet error';
      setWalletLoadError(`Impossible de charger le wallet (${message}). Recharge la page ou reconnecte-toi.`);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) refreshBalance();
  }, [authToken, refreshBalance]);

  useEffect(() => {
    if (!authToken) return;
    const intervalId = setInterval(() => {
      refreshBalance();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [authToken, refreshBalance]);

  const handleTransferSuccess = useCallback(() => {
    setTimeout(() => refreshBalance(), 2000);
  }, [refreshBalance]);

  /* ─── animation variants ─── */
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  // Guard: ProtectedRoute guarantees user/session, but narrow type for TS
  if (!authToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060918]">
        <RefreshCw className="h-7 w-7 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-[#060918] pb-20"
    >
      {/* ═══════════ Animated Background ═══════════ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-600/[0.05] blur-[120px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ═══════════ Hero Header ═══════════ */}
      <motion.div variants={item} className="relative z-10 pt-14 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-sm"
          >
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-semibold tracking-wide text-blue-300">
              Secure &amp; Instant
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-white">Digital </span>
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            Manage your SDA tokens — transfer instantly between users or interact directly with
            Sidra Chain &amp; BSC blockchains.
          </p>
        </div>
      </motion.div>

      {/* ═══════════ Mode Toggle ═══════════ */}
      <motion.div variants={item} className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex justify-center">
          <div className="relative inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl shadow-xl shadow-black/20">
            {/* Sliding pill */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`absolute top-1.5 bottom-1.5 rounded-xl ${
                walletMode === 'internal' ? 'left-1.5' : 'left-[calc(50%+2px)]'
              }`}
              style={{ width: 'calc(50% - 6px)' }}
            >
              <div className="h-full w-full rounded-xl bg-gradient-to-r from-blue-600/80 to-violet-600/80 shadow-lg shadow-blue-500/20" />
            </motion.div>

            <button
              onClick={() => setWalletMode('internal')}
              className={`relative z-10 flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                walletMode === 'internal' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Internal Wallet</span>
              <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Off-chain
              </span>
            </button>

            <button
              onClick={() => setWalletMode('external')}
              className={`relative z-10 flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                walletMode === 'external' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>External Wallet</span>
              <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                On-chain
              </span>
            </button>
          </div>
        </div>

        {/* Mode description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={walletMode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 text-center text-sm text-slate-500"
          >
            {walletMode === 'internal'
              ? 'Transfer SDA to platform users instantly — no gas fees, no blockchain delay.'
              : 'Withdraw to external wallets on Sidra Chain or BSC, or deposit from any supported chain.'}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* ═══════════ Main Content ═══════════ */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {walletLoadError && (
          <motion.div
            variants={item}
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {walletLoadError}
          </motion.div>
        )}

        {/* Wallet is guaranteed to have a user (ProtectedRoute) */}
        <AnimatePresence mode="wait">
            {/* ════════════════ INTERNAL WALLET ════════════════ */}
            {walletMode === 'internal' && (
              <motion.div
                key="internal"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}
                variants={{
                  hidden: { opacity: 0, x: -40 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } },
                }}
                className="space-y-8"
              >
                {/* Balance + Transfer grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Balance Card */}
                  <motion.div variants={item}>
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-cyan-500/10 backdrop-blur-xl p-6 shadow-2xl">
                      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                      <div className="relative z-10">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-400">Platform Balance</p>
                            <p className="text-xs text-slate-500">Internal wallet</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                            <Wallet className="h-5 w-5 text-emerald-400" />
                          </div>
                        </div>

                        <div className="mb-6 flex items-baseline gap-3">
                          <span className="text-4xl font-extrabold tracking-tight text-white">
                            {balance !== null
                              ? parseFloat(balance).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4,
                                })
                              : '—'}
                          </span>
                          <span className="text-lg font-bold text-emerald-400">SDA</span>
                          <SDALogo size="md" />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={refreshBalance}
                          disabled={isRefreshingBalance}
                          className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          <motion.div
                            animate={isRefreshingBalance ? { rotate: 360 } : {}}
                            transition={
                              isRefreshingBalance
                                ? { duration: 1, repeat: Infinity, ease: 'linear' }
                                : {}
                            }
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </motion.div>
                          {isRefreshingBalance ? 'Refreshing…' : 'Refresh'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Transfer Form */}
                  <motion.div variants={item}>
                    <WalletErrorBoundary title="Internal Transfer">
                      <TransferForm
                        walletAddress={null}
                        transferType="internal"
                        authToken={authToken}
                        onSuccess={handleTransferSuccess}
                      />
                    </WalletErrorBoundary>
                  </motion.div>
                </div>

                {/* Transaction History */}
                <motion.div variants={item}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30">
                      <History className="h-4.5 w-4.5 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Transfer History</h3>
                  </div>
                  <WalletErrorBoundary title="Transaction History">
                    <TransactionHistory
                      walletAddress={null}
                      transactionType="internal"
                      authToken={authToken}
                      limit={10}
                    />
                  </WalletErrorBoundary>
                </motion.div>

                {/* Info Cards */}
                <motion.div variants={item} className="space-y-4">
                  <InfoCard title="Internal Transfers" type="success">
                    <p>• Send SIDRA to other platform users instantly</p>
                    <p>• No gas fees — completely free transfers</p>
                    <p>• Transactions processed immediately on our servers</p>
                  </InfoCard>
                  <InfoCard title="Security" type="warning">
                    <p>⚠️ Always verify recipient usernames before sending</p>
                    <p>⚠️ Test with small amounts first when using new recipients</p>
                  </InfoCard>
                </motion.div>
              </motion.div>
            )}

            {/* ════════════════ EXTERNAL WALLET ════════════════ */}
            {walletMode === 'external' && (
              <motion.div
                key="external"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
                variants={{
                  hidden: { opacity: 0, x: 40 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } },
                }}
                className="space-y-8"
              >
                {/* Balance row on external too */}
                <motion.div variants={item}>
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-orange-500/10 via-slate-900/60 to-amber-500/10 backdrop-blur-xl p-6 shadow-2xl">
                    <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Available for Withdrawal</p>
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-3xl font-extrabold tracking-tight text-white">
                            {balance !== null
                              ? parseFloat(balance).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4,
                                })
                              : '—'}
                          </span>
                          <span className="text-lg font-bold text-orange-400">SDA</span>
                          <SDALogo size="md" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Sidra
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          BSC
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Withdraw + Deposit grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <motion.div variants={item}>
                    <WalletErrorBoundary title="Withdrawal Form">
                      <WithdrawForm authToken={authToken} onSuccess={refreshBalance} />
                    </WalletErrorBoundary>
                  </motion.div>
                  <motion.div variants={item}>
                    <WalletErrorBoundary title="Deposit Address">
                      <DepositAddress authToken={authToken} />
                    </WalletErrorBoundary>
                  </motion.div>
                </div>

                {/* External Transaction History */}
                <motion.div variants={item}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30">
                      <History className="h-4.5 w-4.5 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">On-Chain Activity</h3>
                  </div>
                  <WalletErrorBoundary title="On-Chain Activity">
                    <TransactionHistory
                      walletAddress={null}
                      transactionType="internal"
                      authToken={authToken}
                      limit={10}
                    />
                  </WalletErrorBoundary>
                </motion.div>

                {/* Info Cards */}
                <motion.div variants={item} className="space-y-4">
                  <InfoCard title="Withdrawals" type="info">
                    <p>• Choose Sidra Chain or BSC as destination network</p>
                    <p>• Transactions are signed securely on our backend</p>
                    <p>• Transaction hash is stored for tracking on-chain</p>
                  </InfoCard>
                  <InfoCard title="Deposits" type="success">
                    <p>• Send tokens to your unique deposit address</p>
                    <p>• Deposits are credited after confirmation on-chain</p>
                    <p>• Each user has a unique address — no memo needed</p>
                  </InfoCard>
                  <InfoCard title="Important" type="warning">
                    <p>⚠️ Only send supported tokens — sending wrong tokens may result in loss</p>
                    <p>⚠️ Blockchain transactions are irreversible — double-check all addresses</p>
                    <p>⚠️ Withdrawal limits apply — contact support for higher limits</p>
                  </InfoCard>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* ═══════════ Bottom floating accent ═══════════ */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#060918] to-transparent z-20" />
    </motion.div>
  );
}
