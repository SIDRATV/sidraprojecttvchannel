'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Image as ImageIcon, Video, Monitor, Eye, Clock, Check,
  AlertCircle, X, Plus, Loader2, Sparkles, CreditCard, Send, ChevronRight,
  CheckCircle, XCircle, ExternalLink, DollarSign, Info, Phone, Shield,
  FileText, RefreshCcw, Upload, Link2, Calendar, BarChart3, MousePointer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/* ── Types ─────────────────────────────────────────────── */

interface AdPricing {
  id: string;
  ad_type: string;
  duration_days: number;
  price_sidra: number;
  price_sptc: number;
  price_usd: number;
  is_active: boolean;
}

interface Advertisement {
  id: string;
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

/* ── Helpers ───────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

const AD_TYPES = [
  { id: 'banner', label: 'Bannière Dashboard', emoji: '🖼️', icon: Monitor, desc: 'Bannière visible sur le tableau de bord' },
  { id: 'popup', label: 'Pop-up', emoji: '💬', icon: Eye, desc: 'Pop-up affichée aux utilisateurs' },
  { id: 'video', label: 'Vidéo', emoji: '🎬', icon: Video, desc: 'Publicité vidéo courte' },
  { id: 'other', label: 'Autre', emoji: '📢', icon: Megaphone, desc: 'Format personnalisé' },
];

const DURATION_OPTIONS = [
  { days: 1, label: '1 jour' },
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
];

/* ── Main Page ─────────────────────────────────────────── */

export default function PublicitePage() {
  const { session } = useAuth();
  const [activeView, setActiveView] = useState<'create' | 'my-ads'>('create');
  const [myAds, setMyAds] = useState<Advertisement[]>([]);
  const [pricing, setPricing] = useState<AdPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [adStep, setAdStep] = useState(1);
  const [adForm, setAdForm] = useState({
    advertiser_name: '',
    email: '',
    whatsapp: '',
    ad_type: 'banner' as string,
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    redirect_url: '',
    duration_days: 7,
    payment_currency: 'sidra' as 'sidra' | 'sptc' | 'visa',
  });

  /* ── Data Fetching ─── */

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/advertisements/pricing');
      const data = await res.json();
      if (data.pricing) setPricing(data.pricing);
    } catch { /* silent */ }
  }, []);

  const fetchMyAds = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/advertisements/my-ads', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.advertisements) setMyAds(data.advertisements);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session?.access_token]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);
  useEffect(() => { if (activeView === 'my-ads') fetchMyAds(); }, [activeView, fetchMyAds]);

  /* ── Get current price ─── */

  const getCurrentPrice = () => {
    const p = pricing.find((pr) => pr.ad_type === adForm.ad_type && pr.duration_days === adForm.duration_days);
    if (!p) return 0;
    if (adForm.payment_currency === 'sidra') return p.price_sidra;
    if (adForm.payment_currency === 'sptc') return p.price_sptc;
    return p.price_usd;
  };

  const getCurrencyLabel = () => adForm.payment_currency === 'sidra' ? 'Sidra' : adForm.payment_currency === 'sptc' ? 'SPTC' : 'USD';

  /* ── Submit Ad ─── */

  const handleSubmitAd = async () => {
    if (!session?.access_token) {
      setSubmitMessage({ type: 'error', text: 'Vous devez être connecté' });
      return;
    }
    if (!adForm.advertiser_name || !adForm.email || !adForm.media_url) {
      setSubmitMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(adForm),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ type: 'success', text: 'Votre publicité a été soumise ! Elle sera validée par notre équipe avant diffusion.' });
        setAdForm({ advertiser_name: '', email: '', whatsapp: '', ad_type: 'banner', media_url: '', media_type: 'image', redirect_url: '', duration_days: 7, payment_currency: 'sidra' });
        setAdStep(1);
        setTimeout(() => { setActiveView('my-ads'); setSubmitMessage(null); }, 3000);
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch {
      setSubmitMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ─── */

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-32 w-80 h-80 bg-pink-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-semibold mb-4">
            <Sparkles size={14} /> Publicité
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-gray-900 via-purple-600 to-gray-900 dark:from-white dark:via-purple-100 dark:to-white bg-clip-text text-transparent">
              Faire de la Publicité
            </span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Diffusez vos annonces auprès de la communauté Sidra — bannières, pop-ups et vidéos
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-2 mb-8">
          {([
            { id: 'create' as const, label: 'Créer une publicité', icon: Plus },
            { id: 'my-ads' as const, label: 'Mes Publicités', icon: FileText },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-xl ${
                  activeView === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-lg shadow-purple-500/10'
                    : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white'
                }`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Message Banner */}
        <AnimatePresence>
          {submitMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 p-4 mb-6 rounded-xl border backdrop-blur-xl ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
              }`}>
              {submitMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{submitMessage.text}</span>
              <button onClick={() => setSubmitMessage(null)} className="ml-auto hover:opacity-70"><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CREATE AD VIEW ═══ */}
        {activeView === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    adStep >= step
                      ? 'bg-gradient-to-br from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-white/[0.1]'
                  }`}>
                    {adStep > step ? <Check size={14} /> : step}
                  </div>
                  {step < 3 && <div className={`w-10 h-0.5 rounded-full transition-all ${adStep > step ? 'bg-purple-500' : 'bg-gray-200 dark:bg-white/[0.08]'}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6 md:p-8">

              {/* Step 1: Informations annonceur */}
              {adStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Informations de l&#39;annonceur</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Qui êtes-vous ?</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Nom de l&#39;annonceur *</label>
                    <input type="text" value={adForm.advertiser_name} onChange={(e) => setAdForm({ ...adForm, advertiser_name: e.target.value })}
                      placeholder="Votre nom ou société" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Email *</label>
                      <input type="email" value={adForm.email} onChange={(e) => setAdForm({ ...adForm, email: e.target.value })}
                        placeholder="email@exemple.com" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Phone size={12} /> WhatsApp + pays
                      </label>
                      <input type="text" value={adForm.whatsapp} onChange={(e) => setAdForm({ ...adForm, whatsapp: e.target.value })}
                        placeholder="+33 6 12 34 56 78" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50" />
                    </div>
                  </div>

                  {/* Ad Type */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Type de publicité *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {AD_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button key={type.id} onClick={() => setAdForm({ ...adForm, ad_type: type.id, media_type: type.id === 'video' ? 'video' : 'image' })}
                            className={`text-left p-3.5 rounded-xl border transition-all ${
                              adForm.ad_type === type.id
                                ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                                : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
                            }`}>
                            <Icon size={20} className={adForm.ad_type === type.id ? 'text-purple-400 mb-1' : 'text-gray-400 dark:text-slate-500 mb-1'} />
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{type.label}</p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">{type.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAdStep(2)}
                      disabled={!adForm.advertiser_name || !adForm.email}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                      Suivant <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contenu & Diffusion */}
              {adStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Contenu & Diffusion</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Votre visuel et durée de diffusion</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Upload size={12} /> URL du visuel ({adForm.ad_type === 'video' ? 'vidéo' : 'image'}) *
                    </label>
                    <input type="url" value={adForm.media_url} onChange={(e) => setAdForm({ ...adForm, media_url: e.target.value })}
                      placeholder={adForm.ad_type === 'video' ? 'https://exemple.com/video.mp4' : 'https://exemple.com/banniere.png'}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50" />
                    {adForm.media_url && adForm.media_type === 'image' && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={adForm.media_url} alt="Aperçu" className="max-h-32 rounded-lg border border-gray-200 dark:border-white/10 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Link2 size={12} /> Lien de redirection
                    </label>
                    <input type="url" value={adForm.redirect_url} onChange={(e) => setAdForm({ ...adForm, redirect_url: e.target.value })}
                      placeholder="https://votresite.com" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50" />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><Calendar size={12} /> Durée de diffusion</label>
                    <div className="grid grid-cols-3 gap-3">
                      {DURATION_OPTIONS.map((d) => (
                        <button key={d.days} onClick={() => setAdForm({ ...adForm, duration_days: d.days })}
                          className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                            adForm.duration_days === d.days
                              ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/[0.15]'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAdStep(1)} className="px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">← Retour</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAdStep(3)}
                      disabled={!adForm.media_url}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                      Suivant <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Paiement & Confirmation */}
              {adStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Paiement & Confirmation</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Payez et lancez votre campagne</p>
                  </div>

                  {/* Mode de paiement */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Mode de paiement</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: 'sidra' as const, label: 'Sidra', emoji: '🪙', available: true },
                        { id: 'sptc' as const, label: 'SPTC', emoji: '💎', available: false },
                        { id: 'visa' as const, label: 'Visa', emoji: '💳', available: false },
                      ]).map((curr) => (
                        <button key={curr.id} disabled={!curr.available}
                          onClick={() => curr.available && setAdForm({ ...adForm, payment_currency: curr.id })}
                          className={`relative text-left p-4 rounded-xl border transition-all ${
                            !curr.available ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.05] opacity-40 cursor-not-allowed'
                              : adForm.payment_currency === curr.id ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
                          }`}>
                          {!curr.available && <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-[8px] font-bold text-gray-500 dark:text-slate-400">BIENTÔT</span>}
                          <span className="text-2xl mb-1 block">{curr.emoji}</span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{curr.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price display */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Montant à payer</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{getCurrentPrice().toLocaleString('fr-FR')} <span className="text-lg text-purple-400">{getCurrencyLabel()}</span></p>
                      </div>
                      <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <DollarSign size={28} className="text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.08]">
                      <p className="text-[11px] text-purple-600 dark:text-purple-400/70 flex items-center gap-1.5"><Megaphone size={12} /> Activation après validation du contenu</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5"><Info size={13} /> Processus de validation</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300/80">Après paiement, votre contenu publicitaire sera vérifié par notre équipe. Une fois validé, votre campagne sera activée et commencera sa diffusion.</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Récapitulatif</p>
                    <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                      <p><span className="text-gray-400 dark:text-slate-500">Annonceur:</span> {adForm.advertiser_name || '—'}</p>
                      <p><span className="text-gray-400 dark:text-slate-500">Type:</span> {AD_TYPES.find(t => t.id === adForm.ad_type)?.emoji} {AD_TYPES.find(t => t.id === adForm.ad_type)?.label}</p>
                      <p><span className="text-gray-400 dark:text-slate-500">Durée:</span> {DURATION_OPTIONS.find(d => d.days === adForm.duration_days)?.label}</p>
                      {adForm.redirect_url && <p><span className="text-gray-400 dark:text-slate-500">Redirection:</span> {adForm.redirect_url}</p>}
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={12} /> Règles publicitaires</p>
                    <ul className="text-[11px] text-gray-500 dark:text-slate-400 space-y-1.5">
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-purple-400 mt-0.5 flex-shrink-0" /> Le contenu doit respecter la charte graphique et les valeurs de la plateforme</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-purple-400 mt-0.5 flex-shrink-0" /> Aucun contenu illégal, trompeur ou offensant</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-purple-400 mt-0.5 flex-shrink-0" /> La plateforme se réserve le droit de refuser toute publicité</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-purple-400 mt-0.5 flex-shrink-0" /> En cas de rejet de contenu, un remboursement sera effectué</li>
                    </ul>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAdStep(2)} className="px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">← Retour</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={submitting || !session?.access_token}
                      onClick={handleSubmitAd}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-40">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                      {submitting ? 'Paiement en cours...' : 'Payer & Soumettre'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ MY ADS VIEW ═══ */}
        {activeView === 'my-ads' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            {!session?.access_token ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]">
                  <AlertCircle size={28} className="text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Connectez-vous pour voir vos publicités</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-purple-400" />
              </div>
            ) : myAds.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]">
                  <Megaphone size={28} className="text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Aucune publicité</p>
                <p className="text-gray-400 dark:text-slate-600 text-sm mt-1">Créez votre première campagne publicitaire</p>
                <button onClick={() => setActiveView('create')} className="mt-4 px-5 py-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-medium hover:bg-purple-500/30 transition-colors">Créer une publicité</button>
              </div>
            ) : (
              myAds.map((ad, i) => {
                const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
                  pending_review: { label: 'En validation', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Clock },
                  active: { label: 'Actif', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle },
                  rejected: { label: 'Rejeté', color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: XCircle },
                  expired: { label: 'Expiré', color: 'text-gray-400 bg-gray-500/15 border-gray-500/30', icon: Clock },
                  paused: { label: 'En pause', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', icon: AlertCircle },
                };
                const status = statusMap[ad.status] || statusMap.pending_review;
                const StatusIcon = status.icon;
                const adType = AD_TYPES.find(t => t.id === ad.ad_type);
                return (
                  <motion.div key={ad.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/[0.08] p-5 hover:border-gray-300 dark:hover:border-white/[0.15] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{ad.advertiser_name}</h3>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.color}`}>
                            <StatusIcon size={10} /> {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{adType?.emoji} {adType?.label || ad.ad_type} — {ad.duration_days} jours</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-600 flex-shrink-0">{timeAgo(ad.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-slate-500">
                      <span className="flex items-center gap-1"><DollarSign size={11} /> {ad.budget} {ad.currency?.toUpperCase()}</span>
                      {ad.status === 'active' && (
                        <>
                          <span className="flex items-center gap-1"><Eye size={11} /> {(ad.impressions || 0).toLocaleString('fr-FR')} vues</span>
                          <span className="flex items-center gap-1"><MousePointer size={11} /> {(ad.clicks || 0).toLocaleString('fr-FR')} clics</span>
                        </>
                      )}
                      {ad.redirect_url && (
                        <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-400 hover:underline ml-auto"><ExternalLink size={11} /> Lien</a>
                      )}
                    </div>

                    {ad.status === 'rejected' && ad.reject_reason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs font-semibold text-red-400 mb-1">Raison du rejet</p>
                        <p className="text-xs text-red-300/80">{ad.reject_reason}</p>
                      </div>
                    )}

                    {ad.status === 'active' && ad.ends_at && (
                      <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400/70 flex items-center gap-1.5">
                          <Calendar size={11} /> Expire le {new Date(ad.ends_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
