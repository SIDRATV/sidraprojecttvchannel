'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, QrCode, Loader, Shield } from 'lucide-react';

interface DepositAddressProps {
  authToken: string;
}

export function DepositAddress({ authToken }: DepositAddressProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authToken) fetchDepositAddress();
  }, [authToken]);

  const fetchDepositAddress = async () => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/deposit-address', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load deposit address');
      setAddress(data.address);
      setNetwork(data.network);
    } catch (err: any) {
      setError(err.message || 'Failed to load deposit address');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl p-6 shadow-2xl"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <QrCode className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deposit Address</h3>
            <p className="text-xs text-slate-400">Send tokens to this address to fund your wallet</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && address && (
          <div className="space-y-4">
            {/* Network badge */}
            {network && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-300">
                  {network}
                </span>
              </div>
            )}

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Your deposit address
              </label>
              <div className="group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <code className="flex-1 break-all text-sm font-mono text-emerald-300">
                  {address}
                </code>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(address)}
                  className="flex-shrink-0 rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
              <p className="text-xs leading-relaxed text-blue-200/80">
                Only send supported tokens to this address. Deposits are detected automatically every
                3 minutes and require {'\u2248'}3 confirmations before being credited.
                You&apos;ll see a &quot;pending&quot; status while the transaction is being confirmed.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
