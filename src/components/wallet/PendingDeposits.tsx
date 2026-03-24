'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { SDALogo } from './SDALogo';

interface PendingDeposit {
  id: string;
  amount: number;
  tx_hash: string;
  network: string;
  deposit_address: string;
  from_address?: string;
  metadata?: {
    confirmations?: number;
    min_confirmations?: number;
    block_number?: number;
    explorer_url?: string;
  };
  created_at: string;
}

interface RecentlyConfirmed {
  id: string;
  amount: number;
  tx_hash: string;
  network: string;
  metadata?: {
    confirmations?: number;
    explorer_url?: string;
    confirmed_at?: string;
  };
  updated_at: string;
}

interface PendingDepositsProps {
  authToken: string;
  onDepositConfirmed?: () => void;
}

export function PendingDeposits({ authToken, onDepositConfirmed }: PendingDepositsProps) {
  const [pending, setPending] = useState<PendingDeposit[]>([]);
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<RecentlyConfirmed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingDeposits = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/wallet/deposits/pending', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const prevPendingCount = pending.length;
      setPending(data.pending || []);
      setRecentlyConfirmed(data.recentlyConfirmed || []);

      // If we had pending deposits and now there are fewer, a deposit was confirmed
      if (prevPendingCount > 0 && (data.pending || []).length < prevPendingCount) {
        onDepositConfirmed?.();
      }
    } catch {
      // silent fail — will retry on next interval
    } finally {
      setIsLoading(false);
    }
  }, [authToken, pending.length, onDepositConfirmed]);

  useEffect(() => {
    fetchPendingDeposits();
    // Poll every 15 seconds
    const interval = setInterval(fetchPendingDeposits, 15000);
    return () => clearInterval(interval);
  }, [authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

  const getExplorerUrl = (deposit: PendingDeposit | RecentlyConfirmed) => {
    if (deposit.metadata?.explorer_url) return deposit.metadata.explorer_url;
    if (deposit.network === 'sidra') return `https://ledger.sidrachain.com/tx/${deposit.tx_hash}`;
    if (deposit.network === 'bsc') return `https://bscscan.com/tx/${deposit.tx_hash}`;
    return null;
  };

  // Don't render anything if there's nothing to show
  if (!isLoading && pending.length === 0 && recentlyConfirmed.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pending Deposits */}
      <AnimatePresence mode="popLayout">
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-orange-500/10 backdrop-blur-xl p-5 shadow-2xl"
          >
            {/* Animated pulse background */}
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-amber-500/[0.03]" />

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {pending.length}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-200">Dépôts en attente</h3>
                  <p className="text-xs text-amber-300/60">
                    En cours de confirmation sur la blockchain
                  </p>
                </div>
                <div className="ml-auto">
                  <Loader className="h-4 w-4 animate-spin text-amber-400/60" />
                </div>
              </div>

              {/* Info banner */}
              <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  ⏳ Votre dépôt est en cours de confirmation. Cela peut prendre quelques minutes.
                  Votre balance sera mise à jour automatiquement une fois la transaction confirmée.
                </p>
              </div>

              {/* Pending list */}
              <div className="space-y-3">
                {pending.map((deposit) => {
                  const confirmations = deposit.metadata?.confirmations ?? 0;
                  const minConfirmations = deposit.metadata?.min_confirmations ?? 3;
                  const progress = Math.min(100, (confirmations / minConfirmations) * 100);
                  const explorerUrl = getExplorerUrl(deposit);

                  return (
                    <motion.div
                      key={deposit.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {deposit.network}
                          </span>
                          {explorerUrl && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                            >
                              {shortenHash(deposit.tx_hash)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                          +{Number(deposit.amount).toFixed(4)}
                          <SDALogo size="sm" />
                        </div>
                      </div>

                      {/* Confirmation progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Confirmations</span>
                          <span className="font-mono text-amber-300">
                            {confirmations}/{minConfirmations}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                          />
                        </div>
                      </div>

                      <p className="mt-2 text-[10px] text-slate-500">
                        Détecté {new Date(deposit.created_at).toLocaleString()}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recently Confirmed Deposits */}
        {recentlyConfirmed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-green-500/10 backdrop-blur-xl p-5 shadow-2xl"
          >
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-200">Dépôts confirmés</h3>
                  <p className="text-xs text-emerald-300/60">Crédités sur votre balance</p>
                </div>
              </div>

              <div className="space-y-2">
                {recentlyConfirmed.map((deposit) => {
                  const explorerUrl = getExplorerUrl(deposit);
                  return (
                    <motion.div
                      key={deposit.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-slate-400">
                          {explorerUrl ? (
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
                              {shortenHash(deposit.tx_hash)} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            shortenHash(deposit.tx_hash)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        +{Number(deposit.amount).toFixed(4)}
                        <SDALogo size="sm" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && pending.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      )}
    </div>
  );
}
