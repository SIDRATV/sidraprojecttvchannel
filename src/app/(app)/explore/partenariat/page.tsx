'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Star, Award, Check, AlertCircle, Clock, X, Plus, Search, Globe,
  ExternalLink, Loader2, Sparkles, Building2, FileText, Send, ChevronRight,
  Eye, Mail, MapPin, CheckCircle, XCircle, CreditCard, RefreshCcw, Info,
  DollarSign, Edit3, Image as ImageIcon, Phone, MessageSquare, Briefcase,
  Shield, BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PartnerLogosStrip } from '@/components/app/PartnerLogosStrip';

/* ── Types ─────────────────────────────────────────────── */

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_emoji: string;
  logo_url: string;
  website_url: string;
  rating: number;
  reviews_count: number;
  followers_count: number;
  status: string;
  benefits: string[];
  join_date: string;
}

interface PricingItem {
  id: string;
  partnership_type: string;
  duration_type: string;
  price_sidra: number;
  price_sptc: number;
  price_usd: number;
  is_active: boolean;
}

interface Application {
  id: string;
  project_name: string;
  owner_name: string;
  owner_email: string;
  partnership_type: string;
  whatsapp: string;
  domain: string;
  redirect_link: string;
  description: string;
  audience_size: string;
  collaboration_proposal: string;
  benefits: string[];
  countries: string[];
  sda_amount: number;
  has_team_in_5_countries: boolean;
  has_sda_2000_plus: boolean;
  status: string;
  created_at: string;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  duration_type?: string;
  correction_note?: string;
  logo_url?: string;
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

const CATEGORIES = [
  'Technologie', 'Finance', 'Éducation', 'Média', 'E-commerce',
  'Santé', 'Énergie', 'Gouvernement', 'ONG', 'Autre',
];

const PARTNERSHIP_TYPES = [
  { id: 'affiliation', label: 'Affiliation', emoji: '🔗', desc: 'Programme d\'affiliation et commissions' },
  { id: 'fournisseur', label: 'Fournisseur', emoji: '📦', desc: 'Fournir des services ou produits' },
  { id: 'createur', label: 'Créateur', emoji: '🎨', desc: 'Création de contenu et médias' },
  { id: 'investisseur', label: 'Investisseur', emoji: '💰', desc: 'Investissement et financement' },
  { id: 'autre', label: 'Autre', emoji: '🤝', desc: 'Autre type de collaboration' },
];

const DURATION_OPTIONS = [
  { id: '1_month', label: '1 mois', duration_type: 'monthly' },
  { id: '3_months', label: '3 mois', duration_type: 'monthly' },
  { id: '6_months', label: '6 mois', duration_type: 'monthly' },
  { id: '1_year', label: '1 an', duration_type: 'yearly' },
  { id: 'long_term', label: 'Long terme', duration_type: 'yearly' },
];

const COUNTRIES_LIST = [
  'France', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal',
  'Côte d\'Ivoire', 'Cameroun', 'Belgique', 'Canada', 'Suisse',
  'Turquie', 'Arabie Saoudite', 'Émirats Arabes Unis', 'Mauritanie', 'Mali',
];

/* ── Main Page ─────────────────────────────────────────── */

export default function PartenariatPage() {
  const { session } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'browse' | 'apply' | 'my-apps'>('browse');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState({ project_name: '', owner_name: '', owner_email: '', whatsapp: '', domain: '', description: '', audience_size: '', collaboration_proposal: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Application form state
  const [appStep, setAppStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [appForm, setAppForm] = useState({
    project_name: '',
    owner_name: '',
    owner_email: '',
    whatsapp: '',
    partnership_type: 'affiliation' as string,
    domain: '',
    redirect_link: '',
    description: '',
    audience_size: '',
    collaboration_proposal: '',
    countries: [] as string[],
    sda_amount: 0,
    has_team_in_5_countries: false,
    has_sda_2000_plus: false,
    duration_type: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    payment_currency: 'sidra' as 'sidra' | 'sptc' | 'visa',
    logo_url: '',
  });

  /* ── Data Fetching ─── */

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/partnerships/pricing');
      const data = await res.json();
      if (data.pricing) setPricing(data.pricing);
    } catch { /* silent */ }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/partnerships');
      const data = await res.json();
      if (data.partners) setPartners(data.partners);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchMyApps = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/partnerships/my-applications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.applications) setMyApps(data.applications);
    } catch { /* silent */ }
  }, [session?.access_token]);

  useEffect(() => { fetchPartners(); fetchPricing(); }, [fetchPartners, fetchPricing]);
  useEffect(() => { if (activeView === 'my-apps') fetchMyApps(); }, [activeView, fetchMyApps]);

  /* ── Filter Logic ─── */

  const categories = Array.from(new Set(partners.map((p) => p.category)));
  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const featuredPartners = filteredPartners.filter((p) => p.status === 'featured');
  const regularPartners = filteredPartners.filter((p) => p.status !== 'featured');

  /* ── Submit Correction ─── */

  const openEdit = (app: Application) => {
    setEditingApp(app);
    setEditForm({
      project_name: app.project_name,
      owner_name: app.owner_name,
      owner_email: app.owner_email,
      whatsapp: app.whatsapp || '',
      domain: app.domain || '',
      description: app.description || '',
      audience_size: app.audience_size || '',
      collaboration_proposal: app.collaboration_proposal || '',
    });
  };

  const handleSubmitCorrection = async () => {
    if (!session?.access_token || !editingApp) return;
    setEditSubmitting(true);
    try {
      const res = await fetch('/api/partnerships/my-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: editingApp.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ type: 'success', text: 'Candidature mise à jour et renvoyée pour examen !' });
        setEditingApp(null);
        await fetchMyApps();
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' });
      }
    } catch {
      setSubmitMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setEditSubmitting(false);
    }
  };

  /* ── Submit Application ─── */

  const handleSubmitApplication = async () => {
    if (!session?.access_token) {
      setSubmitMessage({ type: 'error', text: 'Vous devez être connecté pour postuler' });
      return;
    }
    if (!appForm.project_name || !appForm.owner_name || !appForm.owner_email) {
      setSubmitMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(appForm),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ type: 'success', text: 'Votre demande sera analysée par notre équipe. En cas de refus, votre caution sera remboursée.' });
        setAppForm({
          project_name: '', owner_name: '', owner_email: '', whatsapp: '',
          partnership_type: 'affiliation', domain: '', redirect_link: '',
          description: '', audience_size: '', collaboration_proposal: '',
          countries: [], sda_amount: 0, has_team_in_5_countries: false, has_sda_2000_plus: false,
          duration_type: 'monthly', payment_currency: 'sidra', logo_url: '',
        });
        setAppStep(1);
        setTimeout(() => { setActiveView('my-apps'); setSubmitMessage(null); }, 3000);
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
        <div className="absolute top-20 -left-32 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-32 w-80 h-80 bg-gold-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-xs font-semibold mb-4">
            <Sparkles size={14} /> Devenir Partenaire
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 dark:from-white dark:via-brand-100 dark:to-white bg-clip-text text-transparent">
              Nos Partenariats
            </span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Collaborez avec l&#39;écosystème Sidra — partenariats stratégiques et à long terme
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-2 mb-8 flex-wrap">
          {([
            { id: 'browse' as const, label: 'Partenaires', icon: Building2 },
            { id: 'apply' as const, label: 'Devenir Partenaire', icon: Plus },
            { id: 'my-apps' as const, label: 'Mes Demandes', icon: FileText },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-xl ${
                  activeView === tab.id
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/40 shadow-lg shadow-brand-500/10'
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

        {/* ═══ BROWSE VIEW ═══ */}
        {activeView === 'browse' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input type="text" placeholder="Rechercher un partenaire..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200 dark:border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors" />
              </div>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${!selectedCategory ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-500 border-gray-200 dark:border-white/[0.08] hover:text-gray-900 dark:hover:text-white'}`}>
                  Tous
                </button>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedCategory === cat ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-500 border-gray-200 dark:border-white/[0.08] hover:text-gray-900 dark:hover:text-white'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-brand-400" />
              </div>
            )}

            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Partenaires', value: partners.length, icon: Building2, gradient: 'from-brand-500 to-emerald-400' },
                  { label: 'En vedette', value: featuredPartners.length, icon: Star, gradient: 'from-gold-500 to-amber-400' },
                  { label: 'Catégories', value: categories.length, icon: Globe, gradient: 'from-blue-500 to-cyan-400' },
                  { label: 'Note moyenne', value: partners.length > 0 ? (partners.reduce((s, p) => s + (p.rating || 0), 0) / partners.length).toFixed(1) : '0', icon: Award, gradient: 'from-purple-500 to-pink-400' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        <div className={`w-7 h-7 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center`}>
                          <Icon size={13} className="text-white" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <PartnerLogosStrip />

            {/* Featured Partners */}
            {featuredPartners.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star size={18} className="text-gold-400" /> Partenaires en Vedette
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {featuredPartners.map((partner, i) => (
                    <motion.div key={partner.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4 }} onClick={() => setSelectedPartner(partner)}
                      className="group bg-gradient-to-br from-gold-500/[0.08] to-transparent backdrop-blur-xl rounded-2xl border border-gold-500/20 p-6 cursor-pointer hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.06] rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {partner.logo_emoji || '🏢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{partner.name}</h3>
                            <span className="px-2 py-0.5 bg-gold-500/20 border border-gold-500/30 rounded-md text-[10px] font-bold text-gold-400 flex-shrink-0">★ VEDETTE</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">{partner.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-500">
                            <span className="flex items-center gap-1"><Globe size={12} /> {partner.category}</span>
                            <span className="flex items-center gap-1"><Star size={12} className="text-gold-400" /> {partner.rating?.toFixed(1) || '0.0'}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {(partner.followers_count || 0).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Partners */}
            {regularPartners.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-brand-400" /> Tous les Partenaires
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularPartners.map((partner, i) => (
                    <motion.div key={partner.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3 }} onClick={() => setSelectedPartner(partner)}
                      className="group bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/[0.08] p-5 cursor-pointer hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-gray-100 dark:bg-white/[0.06] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {partner.logo_emoji || '🏢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{partner.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{partner.category}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-3">{partner.description}</p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] text-[11px] text-gray-500 dark:text-slate-500">
                        <span className="flex items-center gap-1"><Star size={11} className="text-gold-400" /> {partner.rating?.toFixed(1)}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {(partner.followers_count || 0).toLocaleString('fr-FR')}</span>
                        {partner.website_url && <span className="flex items-center gap-1 text-brand-400 ml-auto"><ExternalLink size={11} /></span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!loading && filteredPartners.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]">
                  <Building2 size={32} className="text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-gray-600 dark:text-slate-400 font-medium text-lg">Aucun partenaire trouvé</p>
                <p className="text-gray-400 dark:text-slate-600 text-sm mt-1">Revenez bientôt ou modifiez vos filtres</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ APPLY VIEW ═══ */}
        {activeView === 'apply' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    appStep >= step
                      ? 'bg-gradient-to-br from-brand-500 to-emerald-400 text-white shadow-lg shadow-brand-500/25'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-white/[0.1]'
                  }`}>
                    {appStep > step ? <Check size={14} /> : step}
                  </div>
                  {step < 3 && <div className={`w-10 h-0.5 rounded-full transition-all ${appStep > step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/[0.08]'}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6 md:p-8">

              {/* Step 1: Informations de l'entreprise */}
              {appStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Informations de l&#39;entreprise</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Présentez votre entreprise ou marque</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Nom de l&#39;entreprise / marque *</label>
                    <input type="text" value={appForm.project_name} onChange={(e) => setAppForm({ ...appForm, project_name: e.target.value })}
                      placeholder="Ex: Ma Société Tech" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <ImageIcon size={12} /> Logo (URL)
                    </label>
                    <input type="url" value={appForm.logo_url} onChange={(e) => setAppForm({ ...appForm, logo_url: e.target.value })}
                      placeholder="https://exemple.com/logo.png" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    {appForm.logo_url && (
                      <div className="mt-2 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={appForm.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">Aperçu</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Nom du responsable *</label>
                      <input type="text" value={appForm.owner_name} onChange={(e) => setAppForm({ ...appForm, owner_name: e.target.value })}
                        placeholder="Votre nom" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Email professionnel *</label>
                      <input type="email" value={appForm.owner_email} onChange={(e) => setAppForm({ ...appForm, owner_email: e.target.value })}
                        placeholder="email@exemple.com" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5 block">
                        <Phone size={12} /> WhatsApp + indicatif pays
                      </label>
                      <input type="text" value={appForm.whatsapp} onChange={(e) => setAppForm({ ...appForm, whatsapp: e.target.value })}
                        placeholder="+33 6 12 34 56 78" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Site web / plateforme</label>
                      <input type="text" value={appForm.domain} onChange={(e) => setAppForm({ ...appForm, domain: e.target.value })}
                        placeholder="exemple.com" className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                  </div>

                  {/* Partnership Type */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Type de partenariat *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PARTNERSHIP_TYPES.map((type) => (
                        <button key={type.id} onClick={() => setAppForm({ ...appForm, partnership_type: type.id })}
                          className={`text-left p-3.5 rounded-xl border transition-all ${
                            appForm.partnership_type === type.id
                              ? 'bg-brand-500/10 border-brand-500/40 shadow-lg shadow-brand-500/5'
                              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
                          }`}>
                          <span className="text-xl mb-1 block">{type.emoji}</span>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{type.label}</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5 line-clamp-1">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAppStep(2)}
                      disabled={!appForm.project_name || !appForm.owner_name || !appForm.owner_email}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                      Suivant <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Détails & Proposition */}
              {appStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Détails & Proposition</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Décrivez votre activité et votre proposition</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Description de l&#39;activité *</label>
                    <textarea value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
                      placeholder="Décrivez votre activité, vos produits/services..." rows={3}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Audience estimée</label>
                    <input type="text" value={appForm.audience_size} onChange={(e) => setAppForm({ ...appForm, audience_size: e.target.value })}
                      placeholder="Ex: 50K abonnés, 10K visiteurs/mois..."
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Proposition de collaboration *</label>
                    <textarea value={appForm.collaboration_proposal} onChange={(e) => setAppForm({ ...appForm, collaboration_proposal: e.target.value })}
                      placeholder="Ce que vous apportez + ce que vous attendez de ce partenariat..." rows={3}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Pays d&#39;opération</label>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES_LIST.map((country) => (
                        <button key={country}
                          onClick={() => { const c = appForm.countries.includes(country) ? appForm.countries.filter((x) => x !== country) : [...appForm.countries, country]; setAppForm({ ...appForm, countries: c }); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            appForm.countries.includes(country)
                              ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                              : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-500 border-gray-200 dark:border-white/[0.08] hover:text-gray-900 dark:hover:text-white'
                          }`}>
                          {country}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Durée souhaitée</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {DURATION_OPTIONS.map((d) => (
                        <button key={d.id} onClick={() => setAppForm({ ...appForm, duration_type: d.duration_type as any })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                            appForm.duration_type === d.duration_type
                              ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/[0.15]'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAppStep(1)} className="px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">← Retour</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAppStep(3)}
                      disabled={!appForm.description || !appForm.collaboration_proposal}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                      Suivant <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Caution & Confirmation */}
              {appStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Caution & Confirmation</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Versez la caution et confirmez votre demande</p>
                  </div>

                  {/* Info caution */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5"><Info size={13} /> Important — Caution remboursable</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300/80">Le paiement effectué est une <strong>caution</strong>. Votre demande sera analysée par notre équipe. En cas de refus, votre paiement sera intégralement remboursé.</p>
                  </div>

                  {/* Payment currency */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">Mode de paiement de la caution</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: 'sidra' as const, label: 'Sidra', emoji: '🪙', desc: 'Sidra Coin', available: true },
                        { id: 'sptc' as const, label: 'SPTC', emoji: '💎', desc: 'Bientôt', available: false },
                        { id: 'visa' as const, label: 'Visa', emoji: '💳', desc: 'Bientôt', available: false },
                      ]).map((curr) => (
                        <button key={curr.id} disabled={!curr.available}
                          onClick={() => curr.available && setAppForm({ ...appForm, payment_currency: curr.id })}
                          className={`relative text-left p-4 rounded-xl border transition-all ${
                            !curr.available ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.05] opacity-40 cursor-not-allowed'
                              : appForm.payment_currency === curr.id ? 'bg-brand-500/10 border-brand-500/40 shadow-lg shadow-brand-500/5'
                              : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
                          }`}>
                          {!curr.available && <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-[8px] font-bold text-gray-500 dark:text-slate-400">BIENTÔT</span>}
                          <span className="text-2xl mb-1 block">{curr.emoji}</span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{curr.label}</p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">{curr.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price display */}
                  {(() => {
                    const cp = pricing.find((p) => p.partnership_type === 'project' && p.duration_type === appForm.duration_type);
                    const amt = cp ? (appForm.payment_currency === 'sidra' ? cp.price_sidra : appForm.payment_currency === 'sptc' ? cp.price_sptc : cp.price_usd) : 0;
                    const cl = appForm.payment_currency === 'sidra' ? 'Sidra' : appForm.payment_currency === 'sptc' ? 'SPTC' : 'USD';
                    return (
                      <div className="bg-gradient-to-br from-brand-500/10 to-emerald-500/10 rounded-xl border border-brand-500/30 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Caution à verser</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{amt.toLocaleString('fr-FR')} <span className="text-lg text-brand-400">{cl}</span></p>
                          </div>
                          <div className="w-14 h-14 bg-brand-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign size={28} className="text-brand-400" />
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.08]">
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400/70 flex items-center gap-1.5"><RefreshCcw size={12} /> Remboursement automatique en cas de rejet</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Récapitulatif</p>
                    <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                      <p><span className="text-gray-400 dark:text-slate-500">Entreprise:</span> {appForm.project_name || '—'}</p>
                      <p><span className="text-gray-400 dark:text-slate-500">Contact:</span> {appForm.owner_name} ({appForm.owner_email})</p>
                      <p><span className="text-gray-400 dark:text-slate-500">Type:</span> {PARTNERSHIP_TYPES.find(t => t.id === appForm.partnership_type)?.emoji} {PARTNERSHIP_TYPES.find(t => t.id === appForm.partnership_type)?.label}</p>
                      {appForm.countries.length > 0 && <p><span className="text-gray-400 dark:text-slate-500">Pays:</span> {appForm.countries.join(', ')}</p>}
                    </div>
                  </div>

                  {/* Règles */}
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={12} /> Règles de partenariat</p>
                    <ul className="text-[11px] text-gray-500 dark:text-slate-400 space-y-1.5">
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-brand-400 mt-0.5 flex-shrink-0" /> Fournir des informations réelles et vérifiables</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-brand-400 mt-0.5 flex-shrink-0" /> Respecter l&#39;image et les valeurs de la plateforme</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-brand-400 mt-0.5 flex-shrink-0" /> Toute fraude entraîne un rejet immédiat</li>
                      <li className="flex items-start gap-1.5"><Check size={11} className="text-brand-400 mt-0.5 flex-shrink-0" /> La plateforme se réserve le droit d&#39;accepter ou refuser</li>
                    </ul>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAppStep(2)} className="px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">← Retour</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={submitting || !session?.access_token}
                      onClick={handleSubmitApplication}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-40">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                      {submitting ? 'Paiement en cours...' : 'Verser la caution & Envoyer'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ MY APPS VIEW ═══ */}
        {activeView === 'my-apps' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            {!session?.access_token ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]">
                  <AlertCircle size={28} className="text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Connectez-vous pour voir vos demandes</p>
              </div>
            ) : myApps.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]">
                  <FileText size={28} className="text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Aucune demande</p>
                <p className="text-gray-400 dark:text-slate-600 text-sm mt-1">Soumettez votre première demande de partenariat</p>
                <button onClick={() => setActiveView('apply')} className="mt-4 px-5 py-2.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-xl text-sm font-medium hover:bg-brand-500/30 transition-colors">Postuler maintenant</button>
              </div>
            ) : (
              myApps.map((app, i) => {
                const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
                  pending: { label: 'En révision', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Clock },
                  approved: { label: 'Approuvé', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle },
                  rejected: { label: 'Rejeté', color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: XCircle },
                  correction_needed: { label: 'Correction requise', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30', icon: AlertCircle },
                };
                const status = statusMap[app.status] || statusMap.pending;
                const StatusIcon = status.icon;
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white shadow-sm dark:shadow-none dark:bg-white/[0.03] backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/[0.08] p-5 hover:border-gray-300 dark:hover:border-white/[0.15] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{app.project_name}</h3>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.color}`}>
                            <StatusIcon size={10} /> {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{PARTNERSHIP_TYPES.find(t => t.id === app.partnership_type)?.emoji || '🤝'} {PARTNERSHIP_TYPES.find(t => t.id === app.partnership_type)?.label || app.partnership_type}</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-600 flex-shrink-0">{timeAgo(app.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-slate-500">
                      {app.domain && <span className="flex items-center gap-1"><Globe size={11} /> {app.domain}</span>}
                      {app.countries?.length > 0 && <span className="flex items-center gap-1"><MapPin size={11} /> {app.countries.length} pays</span>}
                      {app.payment_amount != null && app.payment_amount > 0 && (
                        <span className="flex items-center gap-1 text-brand-400"><CreditCard size={11} /> Caution: {app.payment_amount} {app.payment_currency === 'sidra' ? 'Sidra' : app.payment_currency === 'sptc' ? 'SPTC' : 'USD'}</span>
                      )}
                      {app.payment_status === 'refunded' && <span className="flex items-center gap-1 text-emerald-400"><RefreshCcw size={11} /> Remboursé</span>}
                    </div>
                    {app.status === 'correction_needed' && (
                      <div className="mt-3 space-y-2">
                        {app.correction_note && (
                          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <p className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1"><Info size={12} /> Note de correction</p>
                            <p className="text-xs text-orange-300/80">{app.correction_note}</p>
                          </div>
                        )}
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => openEdit(app)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-300 font-medium transition-colors">
                          <Edit3 size={13} /> Modifier et renvoyer ma demande
                        </motion.button>
                      </div>
                    )}
                    {app.status === 'pending' && (
                      <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400/70 flex items-center gap-1.5"><Clock size={11} /> Votre demande est en cours de révision par notre équipe</p>
                      </div>
                    )}
                    {app.status === 'rejected' && app.payment_status === 'refunded' && (
                      <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400/70 flex items-center gap-1.5"><RefreshCcw size={11} /> Votre caution de {app.payment_amount} a été remboursée</p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ═══ PARTNER DETAIL MODAL ═══ */}
        <AnimatePresence>
          {selectedPartner && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/[0.1] shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/[0.08]">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.06] rounded-xl flex items-center justify-center text-4xl flex-shrink-0">{selectedPartner.logo_emoji || '🏢'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h2>
                        {selectedPartner.status === 'featured' && <span className="px-2 py-0.5 bg-gold-500/20 border border-gold-500/30 rounded-md text-[10px] font-bold text-gold-400">★</span>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{selectedPartner.category}</p>
                    </div>
                    <button onClick={() => setSelectedPartner(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 dark:text-slate-400"><X size={18} /></button>
                  </div>
                </div>
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{selectedPartner.description}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 text-center border border-gray-200 dark:border-white/[0.06]">
                      <Star size={16} className="text-gold-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPartner.rating?.toFixed(1)}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500">Note</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 text-center border border-gray-200 dark:border-white/[0.06]">
                      <Users size={16} className="text-brand-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{(selectedPartner.followers_count || 0).toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500">Followers</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 text-center border border-gray-200 dark:border-white/[0.06]">
                      <Eye size={16} className="text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{(selectedPartner.reviews_count || 0).toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500">Avis</p>
                    </div>
                  </div>
                  {selectedPartner.benefits?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Avantages</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPartner.benefits.map((b, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg text-xs text-brand-500 dark:text-brand-300"><Check size={12} /> {b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPartner.website_url && (
                    <a href={selectedPartner.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-gray-200 dark:border-white/[0.1] rounded-xl text-sm text-brand-500 dark:text-brand-400 font-medium transition-colors">
                      <ExternalLink size={16} /> Visiter le site web
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Application Modal */}
          {editingApp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingApp(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/[0.1] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Edit3 size={18} className="text-orange-400" /> Modifier la demande</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Apportez les corrections demand&eacute;es</p>
                  </div>
                  <button onClick={() => setEditingApp(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 dark:text-slate-400"><X size={18} /></button>
                </div>
                {editingApp.correction_note && (
                  <div className="mx-5 mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <p className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1"><Info size={12} /> Note de l&#39;admin</p>
                    <p className="text-xs text-orange-300/80">{editingApp.correction_note}</p>
                  </div>
                )}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Nom de l&#39;entreprise *</label>
                    <input type="text" value={editForm.project_name} onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Responsable *</label>
                      <input type="text" value={editForm.owner_name} onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Email *</label>
                      <input type="email" value={editForm.owner_email} onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Description</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500/50 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 block">Proposition de collaboration</label>
                    <textarea value={editForm.collaboration_proposal} onChange={(e) => setEditForm({ ...editForm, collaboration_proposal: e.target.value })} rows={2}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500/50 resize-none" />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-200 dark:border-white/[0.08] flex justify-end gap-3">
                  <button onClick={() => setEditingApp(null)} className="px-5 py-2.5 bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">Annuler</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={editSubmitting || !editForm.project_name || !editForm.owner_name || !editForm.owner_email}
                    onClick={handleSubmitCorrection}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl text-sm font-semibold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                    {editSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Renvoyer la demande
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
