'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Crown, Zap, Star, Wallet, Tag, Check, X, Loader2,
  ArrowLeft, Shield, Clock, CreditCard, Coins, AlertTriangle,
  CheckCircle, Gift,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  currency: string;
  features: string[];
}

type Duration = 'monthly' | 'quarterly' | 'yearly';

const glass = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl';

const planIcons: Record<string, React.ReactNode> = {
  pro: <Zap size={24} className="text-blue-400" />,
  premium: <Crown size={24} className="text-gold-400" />,
  vip: <Star size={24} className="text-purple-400" />,
};

const planGradients: Record<string, string> = {
  pro: 'from-blue-500/30 via-blue-600/10 to-transparent border-blue-500/40',
  premium: 'from-gold-500/30 via-gold-600/10 to-transparent border-gold-500/40',
  vip: 'from-purple-500/30 via-purple-600/10 to-transparent border-purple-500/40',
};

const durationLabels: Record<Duration, string> = {
  monthly: '1 Mois',
  quarterly: '3 Mois',
  yearly: '1 An',
};

const durationSavings: Record<Duration, string> = {
  monthly: '',
  quarterly: 'Économisez ~17%',
  yearly: 'Économisez ~25%',
};

export default function SubscribePage() {
  const router = useRouter();
  const { session, refreshUser } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('SIDRA');
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration>('monthly');
  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; discountPercent: number; message: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load plans, balance, and active sub
  const loadData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/premium/subscribe', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setPlans(d.plans || []);
        setWalletBalance(d.wallet?.balance || 0);
        setWalletCurrency(d.wallet?.currency || 'SIDRA');
        setActiveSub(d.activeSubscription);
      }
    } catch {}
    setLoading(false);
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  // Get selected plan price
  const plan = plans.find(p => p.id === selectedPlan);
  const priceKey = `price_${duration}` as keyof Plan;
  const basePrice = plan ? Number(plan[priceKey]) || 0 : 0;
  const discount = discountResult?.valid ? (basePrice * discountResult.discountPercent) / 100 : 0;
  const finalPrice = Math.max(0, basePrice - discount);
  const canAfford = walletBalance >= finalPrice;

  // Validate discount code
  const validateCode = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    try {
      const res = await fetch('/api/premium/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, planId: selectedPlan }),
      });
      const d = await res.json();
      setDiscountResult(d);
    } catch {
      setDiscountResult({ valid: false, discountPercent: 0, message: 'Erreur réseau' });
    }
    setValidatingCode(false);
  };

  // Subscribe
  const handleSubscribe = async () => {
    if (!session?.access_token || !selectedPlan || subscribing) return;
    setSubscribing(true);
    setResult(null);
    try {
      const res = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          duration,
          discountCode: discountResult?.valid ? discountCode : undefined,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setResult({ success: true, message: `Abonnement ${plan?.name} activé ! Expire le ${new Date(d.expiresAt).toLocaleDateString('fr-FR')}` });
        // Refresh user profile so premium_plan is immediately available
        await refreshUser();
        // Update local premium storage for immediate UI response
        if (typeof window !== 'undefined') {
          localStorage.setItem('activePremiumPlan', selectedPlan);
          localStorage.setItem('premiumActivatedAt', new Date().toISOString());
          localStorage.setItem('premium_user_status', JSON.stringify({
            isActive: true,
            plan: selectedPlan,
            activatedAt: new Date().toISOString(),
            sptcBalance: 0,
            totalEarned: 0,
            referrals: 0,
          }));
        }
        setTimeout(() => router.push('/premium-dashboard'), 3000);
      } else {
        setResult({ success: false, message: d.error || 'Échec' });
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || 'Erreur réseau' });
    }
    setSubscribing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-400" size={40} />
      </div>
    );
  }

  // Already subscribed
  if (activeSub) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
        <div className="max-w-lg mx-auto mt-20">
          <div className={`${glass} p-8 text-center space-y-4`}>
            <CheckCircle size={48} className="text-green-400 mx-auto" />
            <h2 className="text-2xl font-bold">Vous êtes déjà abonné</h2>
            <p className="text-slate-400">
              Plan <span className="capitalize text-gold-400 font-semibold">{activeSub.plan_id}</span> —
              expire le {new Date(activeSub.expires_at).toLocaleDateString('fr-FR')}
            </p>
            <button onClick={() => router.push('/premium-dashboard')} className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 rounded-lg font-semibold">
              Accéder au Dashboard Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Glassmorphism background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-300 bg-clip-text text-transparent">
              Devenir Membre Premium
            </h1>
            <p className="text-slate-400 text-sm mt-1">Choisissez votre plan et payez avec votre solde wallet</p>
          </div>
        </div>

        {/* Wallet balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${glass} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500/20 rounded-lg">
              <Wallet size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Solde disponible</p>
              <p className="text-lg font-bold text-white">{walletBalance.toFixed(4)} <span className="text-sm text-gold-400">{walletCurrency}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg flex items-center gap-1">
              <Wallet size={12} /> Wallet
            </span>
            <span className="px-2 py-1 bg-slate-700/50 text-slate-500 text-xs rounded-lg flex items-center gap-1">
              <Coins size={12} /> SPTC — Bientôt
            </span>
            <span className="px-2 py-1 bg-slate-700/50 text-slate-500 text-xs rounded-lg flex items-center gap-1">
              <CreditCard size={12} /> Visa — Bientôt
            </span>
          </div>
        </motion.div>

        {/* Step 1: Choose plan */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-gold-500 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Choisissez votre plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const selected = selectedPlan === p.id;
              const grad = planGradients[p.id] || '';
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    selected
                      ? `bg-gradient-to-br ${grad} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {planIcons[p.id]}
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    {p.id === 'premium' && <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full font-semibold">Populaire</span>}
                  </div>
                  <div className="space-y-1">
                    {p.features.slice(0, 4).map((f, i) => (
                      <p key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Check size={10} className="text-green-400 flex-shrink-0" /> {f}
                      </p>
                    ))}
                    {p.features.length > 4 && <p className="text-xs text-slate-500">+{p.features.length - 4} autres</p>}
                  </div>
                  {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-3 flex justify-end">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Duration */}
        <AnimatePresence>
          {selectedPlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-gold-500 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Durée d&apos;abonnement
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(['monthly', 'quarterly', 'yearly'] as Duration[]).map(d => {
                  const dk = `price_${d}` as keyof Plan;
                  const price = plan ? Number(plan[dk]) : 0;
                  return (
                    <motion.button
                      key={d}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDuration(d)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        duration === d
                          ? 'bg-gradient-to-br from-gold-500/20 to-gold-600/5 border-2 border-gold-500/50 shadow-lg shadow-gold-500/10'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <p className="font-bold text-white">{durationLabels[d]}</p>
                      <p className="text-gold-400 font-bold text-lg mt-1">{price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{walletCurrency}</p>
                      {durationSavings[d] && <p className="text-xs text-green-400 mt-1">{durationSavings[d]}</p>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Discount code */}
        <AnimatePresence>
          {selectedPlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-gold-500 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Code de réduction
                <span className="text-xs text-slate-500 font-normal">(optionnel)</span>
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={discountCode}
                    onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountResult(null); }}
                    placeholder="SIDRA-XXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-sm focus:border-gold-500/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={validateCode}
                  disabled={validatingCode || !discountCode.trim()}
                  className="px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  {validatingCode ? <Loader2 size={16} className="animate-spin" /> : 'Vérifier'}
                </button>
              </div>
              {discountResult && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm ${discountResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {discountResult.valid ? <Check size={14} className="inline mr-1" /> : <X size={14} className="inline mr-1" />}
                  {discountResult.message}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary & Pay */}
        <AnimatePresence>
          {selectedPlan && plan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`${glass} p-6 space-y-4`}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-gold-500 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                Récapitulatif
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Plan <span className="capitalize text-white font-medium">{plan.name}</span></span>
                  <span className="text-white">{durationLabels[duration]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Prix</span>
                  <span className="text-white">{basePrice.toFixed(2)} {walletCurrency}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Réduction ({discountResult?.discountPercent}%)</span>
                    <span className="text-green-400">-{discount.toFixed(2)} {walletCurrency}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-bold">Total à payer</span>
                  <span className="text-gold-400 font-bold text-xl">{finalPrice.toFixed(2)} {walletCurrency}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Solde après paiement</span>
                  <span className={canAfford ? 'text-slate-400' : 'text-red-400'}>{(walletBalance - finalPrice).toFixed(4)} {walletCurrency}</span>
                </div>
              </div>

              {!canAfford && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  <AlertTriangle size={16} />
                  Solde insuffisant. Rechargez votre wallet pour continuer.
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield size={14} /> Transaction sécurisée — déduction atomique du solde wallet
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`p-4 rounded-xl text-sm font-medium ${result.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                  >
                    {result.success ? <CheckCircle size={16} className="inline mr-1" /> : <AlertTriangle size={16} className="inline mr-1" />}
                    {result.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: canAfford ? 1.02 : 1 }}
                whileTap={{ scale: canAfford ? 0.98 : 1 }}
                disabled={!canAfford || subscribing || result?.success === true}
                onClick={handleSubscribe}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 rounded-xl font-bold text-lg shadow-lg shadow-gold-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {subscribing ? (
                  <><Loader2 size={20} className="animate-spin" /> Traitement...</>
                ) : result?.success ? (
                  <><CheckCircle size={20} /> Activé !</>
                ) : (
                  <><Crown size={20} /> Payer {finalPrice.toFixed(2)} {walletCurrency}</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
