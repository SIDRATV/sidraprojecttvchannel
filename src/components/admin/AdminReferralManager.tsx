'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, Save, Loader2, RefreshCw, Users, TrendingUp, ToggleLeft, ToggleRight, AlertCircle, CheckCircle } from 'lucide-react';

interface ReferralSettings {
  id?: string;
  reward_per_subscription: number;
  reward_per_renewal: number;
  require_premium_to_earn: boolean;
  max_reward_per_referral: number;
  is_active: boolean;
}

interface AdminReferralManagerProps {
  token: string;
}

export function AdminReferralManager({ token }: AdminReferralManagerProps) {
  const [settings, setSettings] = useState<ReferralSettings>({
    reward_per_subscription: 10,
    reward_per_renewal: 5,
    require_premium_to_earn: true,
    max_reward_per_referral: 500,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/referral-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement paramètres');
      const data = await res.json();
      if (data) setSettings(data);
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/referral-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur sauvegarde');
      }
      setSuccess('Paramètres sauvegardés avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
            <Gift className="text-brand-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Programme de Parrainage</h2>
            <p className="text-sm text-slate-400">Configuration des récompenses d'affiliation</p>
          </div>
        </div>
        <button
          onClick={fetchSettings}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Enable/disable toggle */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Activer le programme</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Désactiver interrompt tous les versements de bonus
          </p>
        </div>
        <button
          onClick={() => setSettings(s => ({ ...s, is_active: !s.is_active }))}
          className={`transition-colors ${settings.is_active ? 'text-green-400' : 'text-slate-500'}`}
        >
          {settings.is_active
            ? <ToggleRight size={36} />
            : <ToggleLeft size={36} />}
        </button>
      </div>

      {/* Reward settings */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-5">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-400" />
          Montants des récompenses
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SettingField
            label="Bonus 1er abonnement (SIDRA)"
            description="Versé quand le filleul souscrit pour la première fois"
            value={settings.reward_per_subscription}
            onChange={v => setSettings(s => ({ ...s, reward_per_subscription: v }))}
          />
          <SettingField
            label="Bonus renouvellement (SIDRA)"
            description="Versé à chaque renouvellement du filleul"
            value={settings.reward_per_renewal}
            onChange={v => setSettings(s => ({ ...s, reward_per_renewal: v }))}
          />
          <SettingField
            label="Plafond par filleul (SIDRA)"
            description="Maximum cumulé autorisé par filleul"
            value={settings.max_reward_per_referral}
            onChange={v => setSettings(s => ({ ...s, max_reward_per_referral: v }))}
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Users size={15} className="text-amber-400" />
            Exiger premium pour gagner
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Si activé, le parrain doit avoir un abonnement premium actif pour recevoir les bonus
          </p>
        </div>
        <button
          onClick={() => setSettings(s => ({ ...s, require_premium_to_earn: !s.require_premium_to_earn }))}
          className={`transition-colors ${settings.require_premium_to_earn ? 'text-amber-400' : 'text-slate-500'}`}
        >
          {settings.require_premium_to_earn
            ? <ToggleRight size={36} />
            : <ToggleLeft size={36} />}
        </button>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>
    </motion.div>
  );
}

function SettingField({
  label, description, value, onChange
}: {
  label: string; description: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-brand-500 transition-colors"
      />
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  );
}
