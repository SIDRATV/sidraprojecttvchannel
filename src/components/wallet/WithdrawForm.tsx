'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Shield,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SDALogo } from './SDALogo';

interface WithdrawFormProps {
  authToken: string;
  onSuccess?: () => void;
}

const networks = [
  {
    id: 'sidra' as const,
    name: 'Sidra Chain',
    icon: '🟢',
    color: 'emerald',
    explorer: 'https://explorer.sidrachain.com/tx/',
  },
  {
    id: 'bsc' as const,
    name: 'BNB Smart Chain',
    icon: '🟡',
    color: 'amber',
    explorer: 'https://bscscan.com/tx/',
  },
];

export function WithdrawForm({ authToken, onSuccess }: WithdrawFormProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'sidra' | 'bsc'>('sidra');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeNetwork = networks.find((n) => n.id === selectedNetwork)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!toAddress.trim()) {
      setError('Wallet address is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          toAddress: toAddress.trim(),
          amount: parsedAmount,
          network: selectedNetwork,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      setSuccess(
        `Withdrawal queued! ID: ${String(data.withdrawalId || '').slice(0, 12)}...`
      );
      setToAddress('');
      setAmount('');
      setDescription('');
      onSuccess?.();

      setTimeout(() => setSuccess(null), 8000);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl p-6 shadow-2xl"
    >
      {/* Glow effect */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <ArrowUpRight className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Withdraw to Wallet</h3>
            <p className="text-xs text-slate-400">Send tokens to an external blockchain address</p>
          </div>
        </div>

        {/* Network Selector */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            <Globe className="mr-1.5 inline h-4 w-4 text-slate-400" />
            Select Network
          </label>
          <div className="grid grid-cols-2 gap-3">
            {networks.map((net) => (
              <motion.button
                key={net.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedNetwork(net.id)}
                className={`relative flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all ${
                  selectedNetwork === net.id
                    ? 'border-brand-500/60 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{net.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{net.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">{net.id}</p>
                </div>
                {selectedNetwork === net.id && (
                  <motion.div
                    layoutId="network-check"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle className="h-4 w-4 text-brand-400" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Destination Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={`0x... (${activeNetwork.name})`}
              disabled={isLoading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              Amount <SDALogo size="sm" />
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>

          {/* Description (optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Note <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this withdrawal for?"
              disabled={isLoading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-200/80">
              Withdrawals are signed securely on our backend. Double-check the address — blockchain
              transactions are irreversible.
            </p>
          </div>

          {/* Error / Success */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                <p className="text-sm text-emerald-300">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full !rounded-xl !py-3 !text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4" />
                Withdraw via {activeNetwork.name}
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
