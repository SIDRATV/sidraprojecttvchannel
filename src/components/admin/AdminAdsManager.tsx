'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Megaphone, Eye, Clock, Check, X, AlertCircle, Loader2,
  CheckCircle, XCircle, DollarSign, Trash2, ExternalLink,
  Monitor, Video, MessageSquare, Image as ImageIcon,
  BarChart3, MousePointer, Calendar, RefreshCcw
} from 'lucide-react';

interface Advertisement {
  id: string;
  user_id: string;
  advertiser_name: string;
  email: string;
  whatsapp: string;
  ad_type: string;
  media_url: string;
  media_type: string;
  redirect_url: string;
  duration_days: number;
  budget: number;
  currency: string;
  status: string;
  reject_reason: string;
  starts_at: string;
  ends_at: string;
  impressions: number;
  clicks: number;
  payment_status: string;
  payment_ref: string;
  admin_note: string;
  created_at: string;
}

interface AdPricing {
  id: string;
  ad_type: string;
  duration_days: number;
  price_sidra: number;
  price_sptc: number;
  price_usd: number;
  is_active: boolean;
}

const AD_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  banner: { label: 'Bannière', emoji: '🖼️' },
  popup: { label: 'Pop-up', emoji: '💬' },
  video: { label: 'Vidéo', emoji: '🎬' },
  other: { label: 'Autre', emoji: '📢' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'En validation', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  active: { label: 'Actif', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  rejected: { label: 'Rejeté', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
  expired: { label: 'Expiré', color: 'text-gray-400 bg-gray-500/15 border-gray-500/30' },
  paused: { label: 'En pause', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
};

export default function AdminAdsManager() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'pricing'>('campaigns');
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [pricing, setPricing] = useState<AdPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }), [session?.access_token]);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/advertisements', { headers: authHeaders() });
      const data = await res.json();
      if (data.advertisements) setAdvertisements(data.advertisements);
      if (data.pricing) setPricing(data.pricing);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session?.access_token, authHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Actions ─── */

  const updateAd = async (id: string, updates: Record<string, any>) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ target: 'advertisement', id, ...updates }),
      });
      const data = await res.json();
      if (data.success) await fetchData();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Supprimer cette publicité ?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/advertisements?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) await fetchData();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    await updateAd(id, { status: 'rejected', reject_reason: rejectReason || 'Contenu non conforme' });
    setRejectingId(null);
    setRejectReason('');
  };

  const handlePricingUpdate = async (pricingId: string, field: string, value: string) => {
    try {
      await fetch('/api/admin/advertisements', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ target: 'pricing', id: pricingId, [field]: field === 'is_active' ? value === 'true' : parseFloat(value) || 0 }),
      });
      await fetchData();
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  const pendingAds = advertisements.filter(a => a.status === 'pending_review');
  const activeAds = advertisements.filter(a => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: advertisements.length, color: 'from-purple-500 to-pink-400', icon: Megaphone },
          { label: 'En attente', value: pendingAds.length, color: 'from-amber-500 to-orange-400', icon: Clock },
          { label: 'Actives', value: activeAds.length, color: 'from-emerald-500 to-green-400', icon: CheckCircle },
          { label: 'Revenus', value: `${advertisements.filter(a => a.payment_status === 'completed').reduce((s, a) => s + Number(a.budget || 0), 0).toLocaleString('fr-FR')}`, color: 'from-blue-500 to-cyan-400', icon: DollarSign },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-7 h-7 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon size={13} className="text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/[0.08] pb-3">
        {([
          { id: 'campaigns' as const, label: 'Campagnes', count: advertisements.length },
          { id: 'pricing' as const, label: 'Tarification', count: pricing.length },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ═══ CAMPAIGNS TAB ═══ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-3">
          {advertisements.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-500">Aucune publicité pour l&apos;instant</div>
          ) : (
            advertisements.map((ad) => {
              const typeInfo = AD_TYPE_LABELS[ad.ad_type] || AD_TYPE_LABELS.other;
              const statusInfo = STATUS_MAP[ad.status] || STATUS_MAP.pending_review;
              const isLoading = actionLoading === ad.id;
              return (
                <div key={ad.id} className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{typeInfo.emoji}</span>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{ad.advertiser_name}</h3>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-slate-500">
                        <span>{typeInfo.label} — {ad.duration_days}j</span>
                        <span>{ad.email}</span>
                        {ad.whatsapp && <span>{ad.whatsapp}</span>}
                        <span className="text-purple-400">{ad.budget} {ad.currency?.toUpperCase()}</span>
                        {ad.status === 'active' && (
                          <>
                            <span className="flex items-center gap-1"><Eye size={11} /> {(ad.impressions || 0).toLocaleString()}</span>
                            <span className="flex items-center gap-1"><MousePointer size={11} /> {(ad.clicks || 0).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      {ad.media_url && (
                        <div className="mt-2">
                          <a href={ad.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1"><ExternalLink size={11} /> Voir le visuel</a>
                        </div>
                      )}
                      {ad.redirect_url && (
                        <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 dark:text-slate-500 hover:underline mt-1 block">→ {ad.redirect_url}</a>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-600 flex-shrink-0">{new Date(ad.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Reject form */}
                  {rejectingId === ad.id && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-2">
                      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Raison du rejet..."
                        className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(ad.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium">Confirmer le rejet</button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400">Annuler</button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                    {ad.status === 'pending_review' && (
                      <>
                        <button onClick={() => updateAd(ad.id, { status: 'active' })} disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-40">
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approuver & Activer
                        </button>
                        <button onClick={() => setRejectingId(ad.id)} disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 disabled:opacity-40">
                          <XCircle size={12} /> Rejeter
                        </button>
                      </>
                    )}
                    {ad.status === 'active' && (
                      <button onClick={() => updateAd(ad.id, { status: 'paused' })} disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 disabled:opacity-40">
                        <Clock size={12} /> Mettre en pause
                      </button>
                    )}
                    {ad.status === 'paused' && (
                      <button onClick={() => updateAd(ad.id, { status: 'active' })} disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-40">
                        <Check size={12} /> Réactiver
                      </button>
                    )}
                    <button onClick={() => deleteAd(ad.id)} disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-400/60 border border-red-500/10 rounded-lg text-xs font-medium hover:bg-red-500/10 disabled:opacity-40 ml-auto">
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ PRICING TAB ═══ */}
      {activeTab === 'pricing' && (
        <div className="space-y-3">
          {['banner', 'popup', 'video'].map((adType) => {
            const typeInfo = AD_TYPE_LABELS[adType] || AD_TYPE_LABELS.other;
            const typePricing = pricing.filter((p) => p.ad_type === adType);
            return (
              <div key={adType} className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">{typeInfo.emoji} {typeInfo.label}</h3>
                <div className="space-y-3">
                  {typePricing.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-200 dark:border-white/[0.06]">
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-400 w-16">{p.duration_days}j</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">Sidra:</span>
                        <input type="number" step="0.01" min="0" value={p.price_sidra}
                          onChange={(e) => handlePricingUpdate(p.id, 'price_sidra', e.target.value)}
                          className="w-20 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">SPTC:</span>
                        <input type="number" step="0.01" min="0" value={p.price_sptc}
                          onChange={(e) => handlePricingUpdate(p.id, 'price_sptc', e.target.value)}
                          className="w-20 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">USD:</span>
                        <input type="number" step="0.01" min="0" value={p.price_usd}
                          onChange={(e) => handlePricingUpdate(p.id, 'price_usd', e.target.value)}
                          className="w-20 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none" />
                      </div>
                      <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                        <input type="checkbox" checked={p.is_active} onChange={(e) => handlePricingUpdate(p.id, 'is_active', String(e.target.checked))}
                          className="rounded border-gray-300 dark:border-slate-600 text-purple-500 focus:ring-purple-500" />
                        <span className="text-[10px] text-gray-500 dark:text-slate-500">Actif</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
