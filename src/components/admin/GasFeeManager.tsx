'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronUp, ChevronDown, Save, RefreshCw, AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react';
import { Card } from '@/components/ui';

interface GasFeeSetting {
  gas_fee_bps: number;
  gas_fee_percent: number;
  description: string;
}

interface GasFeeManagerProps {
  token: string;
}

export function GasFeeManager({ token }: GasFeeManagerProps) {
  const [current, setCurrent] = useState<GasFeeSetting | null>(null);
  const [inputPercent, setInputPercent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/gas-fees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: GasFeeSetting = await res.json();
        setCurrent(data);
        setInputPercent(data.gas_fee_percent.toFixed(2));
      } else {
        setMessage({ type: 'error', text: 'Impossible de charger les paramètres de frais.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors du chargement.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const adjustPercent = (delta: number) => {
    const val = Math.max(0, Math.min(20, parseFloat(inputPercent || '0') + delta));
    setInputPercent(val.toFixed(2));
  };

  const handleSave = async () => {
    const percent = parseFloat(inputPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 20) {
      setMessage({ type: 'error', text: 'Le frais doit être compris entre 0% et 20%.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/gas-fees', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gas_fee_percent: percent }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrent({ gas_fee_bps: data.gas_fee_bps, gas_fee_percent: data.gas_fee_percent, description: data.message });
        setInputPercent(data.gas_fee_percent.toFixed(2));
        setMessage({ type: 'success', text: data.message || 'Gas fee updated successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Impossible de mettre à jour les frais de gas.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la sauvegarde des frais.' });
    } finally {
      setSaving(false);
    }
  };

  const bpsPreview = Math.round(parseFloat(inputPercent || '0') * 100);
  const changed = current !== null && bpsPreview !== current.gas_fee_bps;

  return (
    <Card className="p-6 bg-slate-800/30 border border-amber-500/20">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Frais de Gas</h3>
            <p className="text-slate-400 text-xs">Frais de retrait blockchain — appliqué en temps réel</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300 text-xs leading-relaxed">
              Ce frais s&apos;applique uniquement aux <span className="font-semibold">retraits blockchain</span>. Les virements internes entre utilisateurs sont <span className="font-semibold">toujours gratuits</span>.
            </p>
          </div>

          {/* Current setting */}
          {current && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <p className="text-slate-400 text-xs mb-1">BPS actuel</p>
                <p className="text-white font-bold text-xl">{current.gas_fee_bps}</p>
                <p className="text-slate-500 text-xs">points de base</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <p className="text-slate-400 text-xs mb-1">Taux effectif</p>
                <p className="text-amber-400 font-bold text-xl">{current.gas_fee_percent.toFixed(2)}%</p>
                <p className="text-slate-500 text-xs">par retrait</p>
              </div>
            </div>
          )}

          {/* Input control */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Nouveau Frais de Gas (%)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustPercent(-0.1)}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 hover:text-white transition-all"
              >
                <ChevronDown size={18} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  value={inputPercent}
                  onChange={e => { setInputPercent(e.target.value); setMessage(null); }}
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-white text-center text-xl font-bold outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
              </div>
              <button
                onClick={() => adjustPercent(0.1)}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 hover:text-white transition-all"
              >
                <ChevronUp size={18} />
              </button>
            </div>
            <p className="text-slate-500 text-xs text-center">≈ {bpsPreview} BPS · Range: 0% – 20%</p>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap">
            {[0, 0.5, 1, 1.5, 2, 3].map(preset => (
              <button
                key={preset}
                onClick={() => { setInputPercent(preset.toFixed(2)); setMessage(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  parseFloat(inputPercent) === preset
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-700/30 text-slate-400 border-slate-600/30 hover:border-amber-500/30 hover:text-amber-300'
                }`}
              >
                {preset === 0 ? 'Free' : `${preset}%`}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
              <span className="text-sm">{message.type === 'success' ? 'Frais de gas mis à jour avec succès.' : message.text}</span>
            </motion.div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !changed}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Enregistrement…</>
            ) : (
              <><Save size={15} /> Appliquer les Frais de Gas</>
            )}
          </button>
          {!changed && !saving && current && (
            <p className="text-slate-500 text-xs text-center">Aucune modification à appliquer</p>
          )}
        </div>
      )}
    </Card>
  );
}
