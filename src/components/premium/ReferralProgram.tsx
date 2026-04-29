'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Copy, CheckCircle, Users, TrendingUp, Gift,
  ChevronDown, ChevronUp, Clock, Crown, Info, Loader2,
  ExternalLink, RefreshCw, MousePointer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface ReferralEntry {
  id: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  activated_at: string | null;
  referred: {
    full_name: string;
    username: string;
    premium_plan: string | null;
  };
}

interface RewardEntry {
  amount: number;
  reason: string;
  created_at: string;
}

interface ReferralSettings {
  reward_per_subscription: number;
  reward_per_renewal: number;
  require_premium_to_earn: boolean;
  max_reward_per_referral: number;
}

interface ReferralData {
  code: string;
  clicks: number;
  referrals: ReferralEntry[];
  rewards: RewardEntry[];
  totalRewards: number;
  settings: ReferralSettings;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'En attente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  active:   { label: 'Actif',      color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  inactive: { label: 'Inactif',    color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
};

const REASON_LABELS: Record<string, string> = {
  subscription: 'Premier abonnement',
  renewal:      'Renouvellement',
  signup:       'Inscription',
};

export function ReferralProgram() {
  const { user } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Non authentifié');

      const res = await fetch('/api/referral', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Erreur chargement données');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const referralLink = data?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://sidra.tv'}/ref/${data.code}`
    : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins Sidra TV',
          text: 'Découvre du contenu premium sur Sidra TV avec mon lien de parrainage!',
          url: referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-brand-400 hover:underline flex items-center gap-1 mx-auto">
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  const s = data?.settings;
  const pendingCount  = data?.referrals.filter(r => r.status === 'pending').length  || 0;
  const activeCount   = data?.referrals.filter(r => r.status === 'active').length   || 0;
  const totalCount    = data?.referrals.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="text-brand-400" size={22} />
            Programme de Parrainage
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Invitez des amis et gagnez des SIDRA à chaque abonnement
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total filleuls', value: totalCount, icon: Users, color: 'text-blue-400' },
          { label: 'Filleuls actifs', value: activeCount, icon: Crown, color: 'text-green-400' },
          { label: 'En attente', value: pendingCount, icon: Clock, color: 'text-amber-400' },
          { label: 'SIDRA gagnés', value: (data?.totalRewards || 0).toFixed(2), icon: TrendingUp, color: 'text-brand-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-3 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Share2 size={14} className="text-brand-400" />
          Votre lien de parrainage
          {data?.clicks ? (
            <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
              <MousePointer size={11} /> {data.clicks} clics
            </span>
          ) : null}
        </p>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 font-mono truncate">
            {referralLink || '—'}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30'
            }`}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copié!' : 'Copier'}
          </button>
          <button
            onClick={handleShare}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 border border-gray-700/50 hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink size={14} />
            Partager
          </button>
        </div>
        {data?.code && (
          <p className="text-xs text-gray-500 mt-2">
            Code: <span className="font-mono text-gray-400">{data.code}</span>
          </p>
        )}
      </div>

      {/* Rules panel (collapsible) */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowRules(v => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-200 hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info size={15} className="text-brand-400" />
            Règles du programme
          </span>
          {showRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showRules && s && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-gray-700/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <RuleItem
                    label="Bonus 1er abonnement"
                    value={`${s.reward_per_subscription} SIDRA`}
                    desc="Reçu quand votre filleul s'abonne pour la première fois"
                    icon="🎯"
                  />
                  <RuleItem
                    label="Bonus renouvellement"
                    value={`${s.reward_per_renewal} SIDRA`}
                    desc="Reçu à chaque renouvellement d'abonnement de votre filleul"
                    icon="🔄"
                  />
                  <RuleItem
                    label="Plafond par filleul"
                    value={`${s.max_reward_per_referral} SIDRA`}
                    desc="Récompense cumulée maximale pour un même filleul"
                    icon="📊"
                  />
                  <RuleItem
                    label="Condition pour gagner"
                    value={s.require_premium_to_earn ? 'Premium requis' : 'Aucune'}
                    desc={
                      s.require_premium_to_earn
                        ? 'Vous devez avoir un abonnement premium actif pour recevoir les bonus'
                        : 'Tous les membres peuvent recevoir des bonus de parrainage'
                    }
                    icon={s.require_premium_to_earn ? '👑' : '✅'}
                    highlight={s.require_premium_to_earn}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Les récompenses sont créditées sur votre wallet Sidra automatiquement.
                  Consultez votre wallet dans <span className="text-brand-400">Explorer → Wallet</span>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rewards history (collapsible) */}
      {(data?.rewards?.length || 0) > 0 && (
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowRewards(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-200 hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <TrendingUp size={15} className="text-green-400" />
              Historique des récompenses
              <span className="ml-1 px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 text-xs">
                {data?.rewards.length}
              </span>
            </span>
            {showRewards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <AnimatePresence>
            {showRewards && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-700/40 divide-y divide-gray-700/30">
                  {data?.rewards.slice(0, 20).map((reward, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-300">
                          {REASON_LABELS[reward.reason] || reward.reason}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(reward.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="font-semibold text-green-400">+{Number(reward.amount).toFixed(2)} SIDRA</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Referrals list */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700/40">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Users size={15} className="text-blue-400" />
            Mes filleuls
            {totalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 text-xs">
                {totalCount}
              </span>
            )}
          </h3>
        </div>

        {totalCount === 0 ? (
          <div className="px-4 py-8 text-center">
            <Users size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun filleul pour l'instant</p>
            <p className="text-gray-500 text-xs mt-1">
              Partagez votre lien pour commencer à gagner des SIDRA
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {data?.referrals.map((ref) => {
              const statusInfo = STATUS_LABELS[ref.status] || STATUS_LABELS.pending;
              return (
                <div key={ref.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                    {(ref.referred?.full_name || ref.referred?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {ref.referred?.full_name || ref.referred?.username || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                      {ref.referred?.premium_plan && ref.referred.premium_plan !== 'free' && (
                        <span className="ml-2 text-brand-400">· {ref.referred.premium_plan}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleItem({
  label, value, desc, icon, highlight = false
}: {
  label: string; value: string; desc: string; icon: string; highlight?: boolean
}) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-700/40 bg-white/[0.03]'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-gray-300">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? 'text-amber-400' : 'text-brand-400'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}
