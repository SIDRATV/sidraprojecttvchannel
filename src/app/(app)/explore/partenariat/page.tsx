'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Star,
  TrendingUp,
  ArrowRight,
  Award,
  Check,
  AlertCircle,
  Clock,
  X,
  Plus,
  Search,
  Globe,
  ExternalLink,
  Loader2,
  Sparkles,
  Building2,
  FileText,
  Send,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  Coins,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

interface Application {
  id: string;
  project_name: string;
  owner_name: string;
  owner_email: string;
  partnership_type: string;
  domain: string;
  redirect_link: string;
  benefits: string[];
  countries: string[];
  sda_amount: number;
  has_team_in_5_countries: boolean;
  has_sda_2000_plus: boolean;
  status: string;
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

const CATEGORIES = [
  'Technologie', 'Finance', 'Éducation', 'Média', 'E-commerce',
  'Santé', 'Énergie', 'Gouvernement', 'ONG', 'Autre',
];

const BENEFITS_OPTIONS = [
  'Partage de revenus', 'Co-marketing', 'Support technique',
  'Accès API', 'Formation', 'Visibilité médiatique',
  'Accès communauté', 'Certification',
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

  // Application form state
  const [appStep, setAppStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [appForm, setAppForm] = useState({
    project_name: '',
    owner_name: '',
    owner_email: '',
    partnership_type: 'project' as 'advertising' | 'project',
    domain: '',
    redirect_link: '',
    benefits: [] as string[],
    countries: [] as string[],
    sda_amount: 0,
    has_team_in_5_countries: false,
    has_sda_2000_plus: false,
  });

  /* ── Data Fetching ─── */

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/partnerships');
      const data = await res.json();
      if (data.partners) setPartners(data.partners);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyApps = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/partnerships/my-applications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.applications) setMyApps(data.applications);
    } catch {
      // silent
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    if (activeView === 'my-apps') fetchMyApps();
  }, [activeView, fetchMyApps]);

  /* ── Filter Logic ─── */

  const categories = Array.from(new Set(partners.map((p) => p.category)));

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPartners = filteredPartners.filter((p) => p.status === 'featured');
  const regularPartners = filteredPartners.filter((p) => p.status !== 'featured');

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(appForm),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ type: 'success', text: 'Candidature envoyée avec succès !' });
        setAppForm({
          project_name: '', owner_name: '', owner_email: '', partnership_type: 'project',
          domain: '', redirect_link: '', benefits: [], countries: [],
          sda_amount: 0, has_team_in_5_countries: false, has_sda_2000_plus: false,
        });
        setAppStep(1);
        setTimeout(() => { setActiveView('my-apps'); setSubmitMessage(null); }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-32 w-80 h-80 bg-gold-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '6s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-xs font-semibold mb-4">
            <Sparkles size={14} /> Réseau de Partenaires
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-brand-100 to-white bg-clip-text text-transparent">
              Nos Partenariats
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Découvrez nos partenaires stratégiques et rejoignez l&#39;écosystème Sidra
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8 flex-wrap"
        >
          {([
            { id: 'browse' as const, label: 'Partenaires', icon: Building2 },
            { id: 'apply' as const, label: 'Devenir Partenaire', icon: Plus },
            { id: 'my-apps' as const, label: 'Mes Candidatures', icon: FileText },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-xl ${
                  activeView === tab.id
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/40 shadow-lg shadow-brand-500/10'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Message Banner */}
        <AnimatePresence>
          {submitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 p-4 mb-6 rounded-xl border backdrop-blur-xl ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {submitMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{submitMessage.text}</span>
              <button onClick={() => setSubmitMessage(null)} className="ml-auto hover:opacity-70"><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════ BROWSE VIEW ═══ */}
        {activeView === 'browse' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Search + Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un partenaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    !selectedCategory
                      ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                      : 'bg-white/[0.04] text-slate-500 border-white/[0.08] hover:text-white'
                  }`}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedCategory === cat
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'bg-white/[0.04] text-slate-500 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-brand-400" />
              </div>
            )}

            {/* Stats Banner */}
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
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 border border-white/[0.08]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        <div className={`w-7 h-7 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center`}>
                          <Icon size={13} className="text-white" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Featured Partners */}
            {featuredPartners.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Star size={18} className="text-gold-400" />
                  Partenaires en Vedette
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {featuredPartners.map((partner, i) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedPartner(partner)}
                      className="group bg-gradient-to-br from-gold-500/[0.08] to-transparent backdrop-blur-xl rounded-2xl border border-gold-500/20 p-6 cursor-pointer hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-white/[0.06] rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {partner.logo_emoji || '🏢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">{partner.name}</h3>
                            <span className="px-2 py-0.5 bg-gold-500/20 border border-gold-500/30 rounded-md text-[10px] font-bold text-gold-400 flex-shrink-0">
                              ★ VEDETTE
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{partner.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Globe size={12} /> {partner.category}</span>
                            <span className="flex items-center gap-1"><Star size={12} className="text-gold-400" /> {partner.rating?.toFixed(1) || '0.0'}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {(partner.followers_count || 0).toLocaleString('fr-FR')}</span>
                          </div>
                          {partner.benefits?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {partner.benefits.slice(0, 3).map((b, j) => (
                                <span key={j} className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/15 rounded text-[10px] text-gold-300">
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
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
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-brand-400" />
                  Tous les Partenaires
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularPartners.map((partner, i) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3 }}
                      onClick={() => setSelectedPartner(partner)}
                      className="group bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 cursor-pointer hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-white/[0.06] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {partner.logo_emoji || '🏢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{partner.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{partner.category}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-3">{partner.description}</p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Star size={11} className="text-gold-400" /> {partner.rating?.toFixed(1)}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {(partner.followers_count || 0).toLocaleString('fr-FR')}</span>
                        {partner.website_url && (
                          <span className="flex items-center gap-1 text-brand-400 ml-auto"><ExternalLink size={11} /></span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredPartners.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/[0.08]">
                  <Building2 size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium text-lg">Aucun partenaire trouvé</p>
                <p className="text-slate-600 text-sm mt-1">Revenez bientôt ou modifiez vos filtres</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ APPLY VIEW ═══ */}
        {activeView === 'apply' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    appStep >= step
                      ? 'bg-gradient-to-br from-brand-500 to-emerald-400 text-white shadow-lg shadow-brand-500/25'
                      : 'bg-white/[0.06] text-slate-600 border border-white/[0.1]'
                  }`}>
                    {appStep > step ? <Check size={14} /> : step}
                  </div>
                  {step < 3 && <div className={`w-12 h-0.5 rounded-full transition-all ${appStep > step ? 'bg-brand-500' : 'bg-white/[0.08]'}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-6 md:p-8">
              {/* Step 1: Basic Info */}
              {appStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Informations du Projet</h3>
                    <p className="text-sm text-slate-400">Décrivez votre projet ou entreprise</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nom du projet *</label>
                    <input type="text" value={appForm.project_name}
                      onChange={(e) => setAppForm({ ...appForm, project_name: e.target.value })}
                      placeholder="Ex: Mon Entreprise Tech"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nom du propriétaire *</label>
                      <input type="text" value={appForm.owner_name}
                        onChange={(e) => setAppForm({ ...appForm, owner_name: e.target.value })}
                        placeholder="Votre nom"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email *</label>
                      <input type="email" value={appForm.owner_email}
                        onChange={(e) => setAppForm({ ...appForm, owner_email: e.target.value })}
                        placeholder="email@exemple.com"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Type de partenariat</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: 'project' as const, label: 'Projet / Collaboration', emoji: '🤝', desc: 'Développement conjoint, intégration technique' },
                        { id: 'advertising' as const, label: 'Publicité / Sponsoring', emoji: '📢', desc: 'Visibilité, promotion, placement média' },
                      ]).map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAppForm({ ...appForm, partnership_type: type.id })}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            appForm.partnership_type === type.id
                              ? 'bg-brand-500/10 border-brand-500/40 shadow-lg shadow-brand-500/5'
                              : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{type.emoji}</span>
                          <p className="text-sm font-semibold text-white">{type.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{type.desc}</p>
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

              {/* Step 2: Details */}
              {appStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Détails Complémentaires</h3>
                    <p className="text-sm text-slate-400">Informations techniques et géographiques</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Domaine / Site web</label>
                      <input type="text" value={appForm.domain}
                        onChange={(e) => setAppForm({ ...appForm, domain: e.target.value })}
                        placeholder="exemple.com"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Lien de redirection</label>
                      <input type="text" value={appForm.redirect_link}
                        onChange={(e) => setAppForm({ ...appForm, redirect_link: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Montant SDA disponible</label>
                    <input type="number" value={appForm.sda_amount || ''}
                      onChange={(e) => setAppForm({ ...appForm, sda_amount: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Pays d&#39;opération</label>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES_LIST.map((country) => (
                        <button
                          key={country}
                          onClick={() => {
                            const countries = appForm.countries.includes(country)
                              ? appForm.countries.filter((c) => c !== country)
                              : [...appForm.countries, country];
                            setAppForm({ ...appForm, countries });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            appForm.countries.includes(country)
                              ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                              : 'bg-white/[0.04] text-slate-500 border-white/[0.08] hover:text-white'
                          }`}
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      appForm.has_team_in_5_countries ? 'bg-brand-500/10 border-brand-500/40' : 'bg-white/[0.03] border-white/[0.08]'
                    }`}>
                      <input type="checkbox" checked={appForm.has_team_in_5_countries}
                        onChange={(e) => setAppForm({ ...appForm, has_team_in_5_countries: e.target.checked })}
                        className="sr-only" />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        appForm.has_team_in_5_countries ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
                      }`}>
                        {appForm.has_team_in_5_countries && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-xs text-slate-300">Équipe dans 5+ pays</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      appForm.has_sda_2000_plus ? 'bg-brand-500/10 border-brand-500/40' : 'bg-white/[0.03] border-white/[0.08]'
                    }`}>
                      <input type="checkbox" checked={appForm.has_sda_2000_plus}
                        onChange={(e) => setAppForm({ ...appForm, has_sda_2000_plus: e.target.checked })}
                        className="sr-only" />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        appForm.has_sda_2000_plus ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
                      }`}>
                        {appForm.has_sda_2000_plus && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-xs text-slate-300">2000+ SDA</span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAppStep(1)} className="px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      ← Retour
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAppStep(3)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25">
                      Suivant <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Benefits + Submit */}
              {appStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Avantages Proposés</h3>
                    <p className="text-sm text-slate-400">Sélectionnez les avantages que vous pouvez offrir</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {BENEFITS_OPTIONS.map((benefit) => (
                      <button
                        key={benefit}
                        onClick={() => {
                          const benefits = appForm.benefits.includes(benefit)
                            ? appForm.benefits.filter((b) => b !== benefit)
                            : [...appForm.benefits, benefit];
                          setAppForm({ ...appForm, benefits });
                        }}
                        className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all border text-left ${
                          appForm.benefits.includes(benefit)
                            ? 'bg-brand-500/15 text-brand-300 border-brand-500/40'
                            : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${
                          appForm.benefits.includes(benefit) ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
                        }`}>
                          {appForm.benefits.includes(benefit) && <Check size={10} className="text-white" />}
                        </div>
                        {benefit}
                      </button>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Récapitulatif</p>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p><span className="text-slate-500">Projet:</span> {appForm.project_name || '—'}</p>
                      <p><span className="text-slate-500">Contact:</span> {appForm.owner_name} ({appForm.owner_email})</p>
                      <p><span className="text-slate-500">Type:</span> {appForm.partnership_type === 'advertising' ? '📢 Publicité' : '🤝 Projet'}</p>
                      {appForm.countries.length > 0 && <p><span className="text-slate-500">Pays:</span> {appForm.countries.join(', ')}</p>}
                      {appForm.sda_amount > 0 && <p><span className="text-slate-500">SDA:</span> <span className="text-gold-400">{appForm.sda_amount}</span></p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setAppStep(2)} className="px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      ← Retour
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={submitting || !session?.access_token}
                      onClick={handleSubmitApplication}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-40">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {submitting ? 'Envoi...' : 'Envoyer la Candidature'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ MY APPS VIEW ═══ */}
        {activeView === 'my-apps' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            {!session?.access_token ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/[0.08]">
                  <AlertCircle size={28} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Connectez-vous pour voir vos candidatures</p>
              </div>
            ) : myApps.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/[0.08]">
                  <FileText size={28} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Aucune candidature</p>
                <p className="text-slate-600 text-sm mt-1">Soumettez votre première candidature de partenariat</p>
                <button onClick={() => setActiveView('apply')} className="mt-4 px-5 py-2.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-xl text-sm font-medium hover:bg-brand-500/30 transition-colors">
                  Postuler maintenant
                </button>
              </div>
            ) : (
              myApps.map((app, i) => {
                const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
                  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Clock },
                  approved: { label: 'Approuvé', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle },
                  rejected: { label: 'Rejeté', color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: XCircle },
                };
                const status = statusMap[app.status] || statusMap.pending;
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.15] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white">{app.project_name}</h3>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.color}`}>
                            <StatusIcon size={10} /> {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{app.partnership_type === 'advertising' ? '📢 Publicité' : '🤝 Projet'}</p>
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">{timeAgo(app.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                      {app.domain && <span className="flex items-center gap-1"><Globe size={11} /> {app.domain}</span>}
                      {app.countries?.length > 0 && <span className="flex items-center gap-1"><MapPin size={11} /> {app.countries.length} pays</span>}
                      {app.sda_amount > 0 && <span className="flex items-center gap-1 text-gold-400"><Coins size={11} /> {app.sda_amount} SDA</span>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ PARTNER DETAIL MODAL ═══ */}
        <AnimatePresence>
          {selectedPartner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedPartner(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/[0.08]">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white/[0.06] rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                      {selectedPartner.logo_emoji || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{selectedPartner.name}</h2>
                        {selectedPartner.status === 'featured' && (
                          <span className="px-2 py-0.5 bg-gold-500/20 border border-gold-500/30 rounded-md text-[10px] font-bold text-gold-400">★</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{selectedPartner.category}</p>
                    </div>
                    <button onClick={() => setSelectedPartner(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
                  </div>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedPartner.description}</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                      <Star size={16} className="text-gold-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{selectedPartner.rating?.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">Note</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                      <Users size={16} className="text-brand-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{(selectedPartner.followers_count || 0).toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-slate-500">Followers</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                      <Eye size={16} className="text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{(selectedPartner.reviews_count || 0).toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-slate-500">Avis</p>
                    </div>
                  </div>

                  {selectedPartner.benefits?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Avantages</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPartner.benefits.map((b, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg text-xs text-brand-300">
                            <Check size={12} /> {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPartner.website_url && (
                    <a
                      href={selectedPartner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm text-brand-400 font-medium transition-colors"
                    >
                      <ExternalLink size={16} /> Visiter le site web
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
