'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, DollarSign, Tag, ShieldAlert, TrendingUp,
  Plus, Trash2, Check, X, Loader2, Copy, AlertTriangle,
  Users, Calendar, Percent, Gift, Eye, EyeOff, RefreshCw,
  Zap, Star,
} from 'lucide-react';

interface Props { token: string; }

interface Plan { id: string; name: string; price_monthly: number; price_quarterly: number; price_yearly: number; features: string[]; is_active: boolean; }
interface DiscountCode { id: string; code: string; discount_percent: number; max_uses: number; used_count: number; valid_until: string; plan_restriction: string | null; is_active: boolean; created_at: string; }
interface FraudAlert { id: string; user_id: string; alert_type: string; severity: string; details: any; resolved: boolean; created_at: string; users?: { full_name: string; email: string }; }
interface Stats { totalActive: number; totalRevenue: number; byPlan: Record<string, { count: number; revenue: number }>; recentSubs: any[]; }

const glass = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl';

export function AdminPremiumManager({ token }: Props) {
  const [tab, setTab] = useState<'plans' | 'codes' | 'fraud' | 'stats'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/premium', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setPlans(d.plans || []);
        setCodes(d.discountCodes || []);
        setAlerts(d.fraudAlerts || []);
        setStats(d.stats || null);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const apiPost = async (body: any) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/premium', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMsg({ type: 'ok', text: 'Opération réussie' });
      await load();
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || 'Erreur' });
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'plans', label: 'Plans & Prix', icon: Crown },
    { id: 'codes', label: 'Codes Promo', icon: Gift },
    { id: 'fraud', label: 'Alertes Fraude', icon: ShieldAlert, badge: alerts.length },
    { id: 'stats', label: 'Statistiques', icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 shadow-lg shadow-gold-500/25'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {'badge' in t && t.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Status message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold-400" size={32} /></div>
      ) : (
        <>
          {tab === 'plans' && <PlansSection plans={plans} onSave={apiPost} saving={saving} />}
          {tab === 'codes' && <CodesSection codes={codes} onAction={apiPost} saving={saving} />}
          {tab === 'fraud' && <FraudSection alerts={alerts} onResolve={apiPost} saving={saving} />}
          {tab === 'stats' && <StatsSection stats={stats} />}
        </>
      )}
    </div>
  );
}

// ─── PLANS ──────────────────────────────────────
function PlansSection({ plans, onSave, saving }: { plans: Plan[]; onSave: (b: any) => void; saving: boolean }) {
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [editingFeatures, setEditingFeatures] = useState<Record<string, string>>({});

  const planIcons: Record<string, React.ReactNode> = {
    pro: <Zap size={20} className="text-blue-400" />,
    premium: <Crown size={20} className="text-gold-400" />,
    vip: <Star size={20} className="text-purple-400" />,
  };

  const planGradients: Record<string, string> = {
    pro: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    premium: 'from-gold-500/20 to-gold-600/5 border-gold-500/30',
    vip: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  };

  return (
    <div className="grid gap-6">
      {plans.map(plan => {
        const ed = editing[plan.id] || {};
        const grad = planGradients[plan.id] || 'from-slate-500/20 to-slate-600/5 border-slate-500/30';
        return (
          <motion.div key={plan.id} layout className={`${glass} bg-gradient-to-br ${grad} p-6`}>
            <div className="flex items-center gap-3 mb-5">
              {planIcons[plan.id]}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              {!plan.is_active && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Désactivé</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {(['monthly', 'quarterly', 'yearly'] as const).map(dur => {
                const key = `price_${dur}` as keyof Plan;
                const labels: Record<string, string> = { monthly: '1 Mois', quarterly: '3 Mois', yearly: '1 An' };
                return (
                  <div key={dur}>
                    <label className="text-xs text-slate-400 mb-1 block">{labels[dur]}</label>
                    <div className="relative">
                      <input
                        type="number" step="0.01" min="0"
                        defaultValue={plan[key] as number}
                        onChange={e => setEditing(p => ({ ...p, [plan.id]: { ...p[plan.id], [key]: parseFloat(e.target.value) } }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">SIDRA</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">Fonctionnalités (une par ligne)</label>
              <textarea
                rows={4}
                defaultValue={(plan.features || []).join('\n')}
                onChange={e => setEditingFeatures(p => ({ ...p, [plan.id]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none resize-none"
              />
            </div>

            <button
              disabled={saving}
              onClick={() => {
                const updates: any = { ...ed };
                if (editingFeatures[plan.id] !== undefined) {
                  updates.features = editingFeatures[plan.id].split('\n').map((f: string) => f.trim()).filter(Boolean);
                }
                if (Object.keys(updates).length === 0) return;
                onSave({ action: 'update_plan', planId: plan.id, updates });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Sauvegarder
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── DISCOUNT CODES ─────────────────────────────
function CodesSection({ codes, onAction, saving }: { codes: DiscountCode[]; onAction: (b: any) => void; saving: boolean }) {
  const [showNew, setShowNew] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState(10);
  const [newMax, setNewMax] = useState(50);
  const [newUntil, setNewUntil] = useState('');
  const [newPlanRestriction, setNewPlanRestriction] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SIDRA-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(code);
  };

  const handleCreate = () => {
    if (!newCode || !newUntil) return;
    onAction({
      action: 'create_discount',
      code: newCode,
      discountPercent: newPercent,
      maxUses: newMax,
      validUntil: new Date(newUntil).toISOString(),
      planRestriction: newPlanRestriction || undefined,
    });
    setShowNew(false);
    setNewCode('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2"><Gift size={18} className="text-gold-400" /> Codes de Réduction</h3>
        <button
          onClick={() => { setShowNew(!showNew); generateCode(); setNewUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-lg text-sm hover:bg-gold-500/30 transition-all"
        >
          <Plus size={14} /> Nouveau Code
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`${glass} p-5 space-y-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Code</label>
                <div className="flex gap-2">
                  <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-gold-500/50 focus:outline-none" />
                  <button onClick={generateCode} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Réduction %</label>
                <input type="number" min={1} max={100} value={newPercent} onChange={e => setNewPercent(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Utilisations max</label>
                <input type="number" min={1} value={newMax} onChange={e => setNewMax(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Valide jusqu'au</label>
                <input type="date" value={newUntil} onChange={e => setNewUntil(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Restriction plan (optionnel)</label>
                <select value={newPlanRestriction} onChange={e => setNewPlanRestriction(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 focus:outline-none">
                  <option value="">Tous les plans</option>
                  <option value="pro">Pro uniquement</option>
                  <option value="premium">Premium uniquement</option>
                  <option value="vip">VIP uniquement</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={saving || !newCode || !newUntil} onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Créer
              </button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-white/5 text-slate-400 rounded-lg text-sm hover:bg-white/10">Annuler</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {codes.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Aucun code de réduction</p>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <motion.div key={c.id} layout className={`${glass} p-4 flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${c.is_active ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Tag size={16} className={c.is_active ? 'text-green-400' : 'text-red-400'} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{c.code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.code); setCopied(c.id); setTimeout(() => setCopied(null), 2000); }}>
                      {copied === c.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-500 hover:text-white" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="text-gold-400 font-semibold">-{c.discount_percent}%</span>
                    <span>{c.used_count}/{c.max_uses} utilisé</span>
                    <span>expire {new Date(c.valid_until).toLocaleDateString('fr-FR')}</span>
                    {c.plan_restriction && <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">{c.plan_restriction}</span>}
                  </div>
                </div>
              </div>
              {c.is_active && (
                <button onClick={() => onAction({ action: 'deactivate_discount', codeId: c.id })}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400">
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FRAUD ──────────────────────────────────────
function FraudSection({ alerts, onResolve, saving }: { alerts: FraudAlert[]; onResolve: (b: any) => void; saving: boolean }) {
  const [resolveNote, setResolveNote] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const severityColors: Record<string, string> = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2">
        <ShieldAlert size={18} className="text-red-400" /> Alertes de Fraude
        {alerts.length > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{alerts.length}</span>}
      </h3>

      {alerts.length === 0 ? (
        <div className={`${glass} p-8 text-center`}>
          <Check size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-slate-400">Aucune alerte de fraude en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <motion.div key={a.id} layout className={`${glass} p-5`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-orange-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{a.users?.full_name || a.users?.email || a.user_id}</p>
                    <p className="text-xs text-slate-400">{a.alert_type.replace(/_/g, ' ')} — {new Date(a.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[a.severity] || severityColors.medium}`}>
                  {a.severity}
                </span>
              </div>
              {a.details && (
                <pre className="text-xs text-slate-500 bg-black/20 rounded-lg p-2 mb-3 overflow-x-auto">{JSON.stringify(a.details, null, 2)}</pre>
              )}
              {resolvingId === a.id ? (
                <div className="flex gap-2">
                  <input value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Note de résolution..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:border-green-500/50 focus:outline-none" />
                  <button disabled={saving} onClick={() => { onResolve({ action: 'resolve_fraud', alertId: a.id, note: resolveNote }); setResolvingId(null); setResolveNote(''); }}
                    className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => setResolvingId(null)} className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-sm">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setResolvingId(a.id)} className="text-sm text-green-400 hover:underline">Résoudre</button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STATS ──────────────────────────────────────
function StatsSection({ stats }: { stats: Stats | null }) {
  if (!stats) return <p className="text-slate-500 text-center py-8">Statistiques non disponibles</p>;

  const planColors: Record<string, string> = { pro: 'from-blue-500 to-blue-400', premium: 'from-gold-500 to-gold-400', vip: 'from-purple-500 to-pink-500' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <p className="text-slate-400 text-xs">Abonnés actifs</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalActive}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-slate-400 text-xs">Revenus totaux</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent mt-1">
            {stats.totalRevenue.toFixed(2)} SIDRA
          </p>
        </div>
      </div>

      {/* By plan breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(stats.byPlan).map(([plan, data]) => (
          <div key={plan} className={`${glass} p-5`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${planColors[plan] || 'from-slate-500 to-slate-400'} flex items-center justify-center mb-3`}>
              {plan === 'pro' ? <Zap size={16} className="text-white" /> : plan === 'vip' ? <Star size={16} className="text-white" /> : <Crown size={16} className="text-white" />}
            </div>
            <p className="text-white font-bold capitalize">{plan}</p>
            <p className="text-slate-400 text-sm">{data.count} abonnés — {data.revenue.toFixed(2)} SIDRA</p>
          </div>
        ))}
      </div>

      {/* Recent subs */}
      {stats.recentSubs.length > 0 && (
        <div className={`${glass} p-5`}>
          <h4 className="text-white font-bold mb-3 flex items-center gap-2"><Calendar size={16} className="text-gold-400" /> Abonnements Récents</h4>
          <div className="space-y-2">
            {stats.recentSubs.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{s.users?.full_name || s.users?.email || '—'}</p>
                  <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <span className="text-gold-400 font-semibold text-sm">{Number(s.amount_paid).toFixed(2)} SIDRA</span>
                  <p className="text-xs text-slate-500 capitalize">{s.plan_id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
