'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Globe,
  Users,
  Star,
  Users2,
  Building2,
  Mail,
  ExternalLink,
  FileText,
  Sparkles,
  Eye,
  Check,
  XCircle,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Link2,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Play,
} from 'lucide-react';

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
  created_at: string;
}

interface PartnerApplication {
  id: string;
  user_id: string;
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
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  duration_type: string;
  correction_note: string;
  created_at: string;
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

interface SponsoredBanner {
  id: string;
  application_id: string | null;
  partner_id: string | null;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  media_type: string;
  autoplay: boolean;
  display_duration: number;
  link_url: string;
  banner_type: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  priority: number;
  created_at: string;
}

const CATEGORIES = [
  'Technologie', 'Finance', 'Éducation', 'Média', 'E-commerce',
  'Santé', 'Énergie', 'Gouvernement', 'ONG', 'Autre',
];

const PARTNER_STATUS = [
  { value: 'active', label: 'Actif', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  { value: 'featured', label: 'En vedette', color: 'text-gold-400 bg-gold-500/20 border-gold-500/30' },
  { value: 'inactive', label: 'Inactif', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
];

const APP_STATUS = [
  { value: 'pending', label: 'En attente', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: Clock },
  { value: 'approved', label: 'Approuvé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: Check },
  { value: 'rejected', label: 'Rejeté', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
];

export function AdminPartnershipsManager({ token }: { token: string }) {
  const [tab, setTab] = useState<'partners' | 'applications' | 'pricing' | 'banners'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [banners, setBanners] = useState<SponsoredBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingApp, setViewingApp] = useState<PartnerApplication | null>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SponsoredBanner | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Technologie',
    logo_emoji: '🏢',
    logo_url: '',
    website_url: '',
    status: 'active',
    benefits: '',
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    media_type: 'image' as 'image' | 'video',
    autoplay: false,
    display_duration: 10,
    link_url: '',
    banner_type: 'large',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: '',
    priority: 0,
    partner_id: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partnerships?type=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.partners) setPartners(data.partners);
      if (data.applications) setApplications(data.applications);
      if (data.pricing) setPricing(data.pricing);
      if (data.banners) setBanners(data.banners);
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'Technologie', logo_emoji: '🏢', logo_url: '', website_url: '', status: 'active', benefits: '' });
    setEditingPartner(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      logo_emoji: p.logo_emoji || '🏢',
      logo_url: p.logo_url || '',
      website_url: p.website_url || '',
      status: p.status,
      benefits: (p.benefits || []).join(', '),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Nom et description requis' });
      return;
    }
    setSaving(true);
    try {
      const benefitsArr = form.benefits.split(',').map(b => b.trim()).filter(Boolean);
      const body = editingPartner
        ? { id: editingPartner.id, target: 'partner', ...form, benefits: benefitsArr }
        : { ...form, benefits: benefitsArr };

      const res = await fetch('/api/admin/partnerships', {
        method: editingPartner ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: editingPartner ? 'Partenaire mis à jour' : 'Partenaire créé' });
        setShowModal(false);
        resetForm();
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/partnerships?id=${encodeURIComponent(id)}&target=partner`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Partenaire supprimé' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAppStatus = async (appId: string, newStatus: string, adminNote?: string) => {
    try {
      const body: any = { id: appId, target: 'application', status: newStatus };
      if (adminNote) body.admin_note = adminNote;
      if (newStatus === 'correction_needed' && correctionNote) {
        body.correction_note = correctionNote;
      }
      const res = await fetch('/api/admin/partnerships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const labels: Record<string, string> = { approved: 'approuvée', rejected: 'rejetée (remboursement effectué)', correction_needed: 'correction demandée' };
        setMessage({ type: 'success', text: `Candidature ${labels[newStatus] || newStatus}` });
        setCorrectionNote('');
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
  };

  const handlePricingUpdate = async (pricingId: string, field: string, value: number) => {
    try {
      const res = await fetch('/api/admin/partnerships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: pricingId, target: 'pricing', [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Prix mis à jour' });
        await fetchData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
  };

  const handleSaveBanner = async () => {
    if (bannerForm.media_type === 'image' && !bannerForm.image_url) {
      setMessage({ type: 'error', text: 'URL de l\'image requise' });
      return;
    }
    if (bannerForm.media_type === 'video' && !bannerForm.video_url) {
      setMessage({ type: 'error', text: 'URL de la vidéo requise' });
      return;
    }
    if (!bannerForm.ends_at) {
      setMessage({ type: 'error', text: 'Date de fin requise' });
      return;
    }
    setSaving(true);
    try {
      const body = editingBanner
        ? { id: editingBanner.id, target: 'banner', ...bannerForm, partner_id: bannerForm.partner_id || null }
        : { target: 'banner', ...bannerForm, partner_id: bannerForm.partner_id || null };

      const res = await fetch('/api/admin/partnerships', {
        method: editingBanner ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: editingBanner ? 'Bannière mise à jour' : 'Bannière créée' });
        setShowBannerModal(false);
        setEditingBanner(null);
        setBannerForm({ title: '', description: '', image_url: '', video_url: '', media_type: 'image', autoplay: false, display_duration: 10, link_url: '', banner_type: 'large', starts_at: new Date().toISOString().split('T')[0], ends_at: '', priority: 0, partner_id: '' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/partnerships?id=${encodeURIComponent(id)}&target=banner`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Bannière supprimée' });
        await fetchData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleBanner = async (banner: SponsoredBanner) => {
    try {
      await fetch('/api/admin/partnerships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: banner.id, target: 'banner', is_active: !banner.is_active }),
      });
      await fetchData();
    } catch {}
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const featuredCount = partners.filter(p => p.status === 'featured').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users2 size={24} className="text-brand-400" />
            Gestion des Partenariats
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {partners.length} partenaires · {featuredCount} en vedette · {pendingCount} candidature(s) en attente
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow"
        >
          <Plus size={18} />
          Nouveau Partenaire
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Partenaires', value: partners.length, icon: Building2, color: 'from-brand-500 to-emerald-400' },
          { label: 'En vedette', value: featuredCount, icon: Star, color: 'from-gold-500 to-amber-400' },
          { label: 'Candidatures', value: applications.length, icon: FileText, color: 'from-blue-500 to-cyan-400' },
          { label: 'En attente', value: pendingCount, icon: Clock, color: 'from-amber-500 to-orange-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white/[0.04] backdrop-blur-xl rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</span>
                <div className={`w-7 h-7 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon size={14} className="text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'partners' as const, label: `Partenaires (${partners.length})` },
          { key: 'applications' as const, label: `Candidatures (${applications.length})` },
          { key: 'pricing' as const, label: `Tarification (${pricing.length})` },
          { key: 'banners' as const, label: `Bannières (${banners.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-xl ${
              tab === t.key
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PARTNERS LIST */}
      {tab === 'partners' && (
        <div className="space-y-3">
          {partners.map((p) => {
            const statusInfo = PARTNER_STATUS.find(s => s.value === p.status) || PARTNER_STATUS[0];
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/[0.06] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {p.logo_emoji || '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">{p.name}</h3>
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Globe size={12} /> {p.category}</span>
                      <span className="flex items-center gap-1"><Star size={12} className="text-gold-400" /> {p.rating?.toFixed(1) || '0.0'}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {p.followers_count || 0} followers</span>
                      {p.website_url && (
                        <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                          <ExternalLink size={12} /> Site web
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  <select
                    value={p.status}
                    onChange={async (e) => {
                      try {
                        await fetch('/api/admin/partnerships', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ id: p.id, target: 'partner', status: e.target.value }),
                        });
                        await fetchData();
                      } catch {}
                    }}
                    className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
                  >
                    {PARTNER_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-xs text-slate-300 transition-colors">
                    <Edit3 size={13} /> Modifier
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={deletingId === p.id}
                    onClick={() => { if (confirm('Supprimer ce partenaire ?')) handleDelete(p.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-colors disabled:opacity-50">
                    {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Supprimer
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
          {partners.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                <Users2 size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Aucun partenaire</p>
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS LIST */}
      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.map((app) => {
            const statusInfo = APP_STATUS.find(s => s.value === app.status) || APP_STATUS[0];
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{app.project_name}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Par <span className="text-white">{app.owner_name}</span> · {app.owner_email}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      <span className="capitalize">{app.partnership_type === 'advertising' ? '📢 Publicité' : '🤝 Projet'}</span>
                      {app.domain && <span className="flex items-center gap-1"><Globe size={11} /> {app.domain}</span>}
                      {app.countries?.length > 0 && <span>{app.countries.length} pays</span>}
                      {app.sda_amount > 0 && <span className="text-gold-400">{app.sda_amount} SDA</span>}
                      {app.payment_status && (
                        <span className={`font-medium ${app.payment_status === 'paid' ? 'text-emerald-400' : app.payment_status === 'refunded' ? 'text-red-400' : 'text-slate-500'}`}>
                          💳 {app.payment_status === 'paid' ? 'Payé' : app.payment_status === 'refunded' ? 'Remboursé' : 'Non payé'}
                          {app.payment_amount > 0 && ` · ${app.payment_amount} ${(app.payment_currency || '').toUpperCase()}`}
                        </span>
                      )}
                      {app.duration_type && <span>📅 {app.duration_type === 'weekly' ? 'Hebdo' : app.duration_type === 'monthly' ? 'Mensuel' : 'Annuel'}</span>}
                      <span>{new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {app.benefits?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.benefits.slice(0, 3).map((b, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white/[0.06] rounded text-[10px] text-slate-400">{b}</span>
                        ))}
                        {app.benefits.length > 3 && <span className="text-[10px] text-slate-500">+{app.benefits.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewingApp(app)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    <Eye size={13} /> Détails
                  </motion.button>
                  <div className="flex-1" />
                  {app.status === 'pending' && (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAppStatus(app.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 transition-colors">
                        <Check size={13} /> Approuver
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setViewingApp(app); setCorrectionNote(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs text-amber-400 transition-colors">
                        <MessageSquare size={13} /> Correction
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAppStatus(app.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-colors">
                        <XCircle size={13} /> Rejeter
                      </motion.button>
                    </>
                  )}
                  {app.status === 'correction_needed' && (
                    <span className="text-xs text-amber-400 italic">En attente de correction du demandeur</span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {applications.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                <FileText size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Aucune candidature</p>
            </div>
          )}
        </div>
      )}

      {/* APPLICATION DETAIL MODAL */}
      <AnimatePresence>
        {viewingApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingApp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{viewingApp.project_name}</h3>
                <button onClick={() => setViewingApp(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Propriétaire</p>
                    <p className="text-sm text-white">{viewingApp.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-white">{viewingApp.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <p className="text-sm text-white capitalize">{viewingApp.partnership_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Domaine</p>
                    <p className="text-sm text-white">{viewingApp.domain || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Lien de redirection</p>
                    <p className="text-sm text-brand-400">{viewingApp.redirect_link || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Montant SDA</p>
                    <p className="text-sm text-gold-400">{viewingApp.sda_amount || 0} SDA</p>
                  </div>
                </div>
                {viewingApp.countries?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pays ({viewingApp.countries.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {viewingApp.countries.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/[0.06] rounded text-xs text-slate-300">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {viewingApp.benefits?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Avantages proposés</p>
                    <div className="flex flex-wrap gap-1">
                      {viewingApp.benefits.map((b, i) => (
                        <span key={i} className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 rounded text-xs text-brand-300">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Équipe dans 5+ pays</p>
                    <p className="text-sm text-white">{viewingApp.has_team_in_5_countries ? '✅ Oui' : '❌ Non'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">2000+ SDA</p>
                    <p className="text-sm text-white">{viewingApp.has_sda_2000_plus ? '✅ Oui' : '❌ Non'}</p>
                  </div>
                </div>
                {/* Payment Info */}
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 font-semibold">💳 Informations de paiement</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Statut paiement</p>
                      <p className={`text-sm font-medium ${viewingApp.payment_status === 'paid' ? 'text-emerald-400' : viewingApp.payment_status === 'refunded' ? 'text-red-400' : 'text-slate-400'}`}>
                        {viewingApp.payment_status === 'paid' ? '✅ Payé' : viewingApp.payment_status === 'refunded' ? '↩️ Remboursé' : '⏳ Non payé'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Montant</p>
                      <p className="text-sm text-white">{viewingApp.payment_amount || 0} {(viewingApp.payment_currency || '-').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Durée</p>
                      <p className="text-sm text-white capitalize">{viewingApp.duration_type === 'weekly' ? 'Hebdomadaire' : viewingApp.duration_type === 'monthly' ? 'Mensuel' : viewingApp.duration_type === 'yearly' ? 'Annuel' : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Moyen de paiement</p>
                      <p className="text-sm text-white capitalize">{viewingApp.payment_currency || '-'}</p>
                    </div>
                  </div>
                </div>
                {/* Correction Note Input */}
                {viewingApp.status === 'pending' && (
                  <div>
                    <label className="text-xs font-medium text-amber-400 mb-1.5 block">💬 Note de correction (optionnel)</label>
                    <textarea
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      placeholder="Décrivez les informations manquantes ou corrections nécessaires..."
                      rows={3}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>
                )}
              </div>
              {viewingApp.status === 'pending' && (
                <div className="p-6 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-wrap">
                  <button onClick={() => { handleAppStatus(viewingApp.id, 'rejected'); setViewingApp(null); }}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
                    Rejeter (+ Remboursement)
                  </button>
                  {correctionNote && (
                    <button onClick={() => { handleAppStatus(viewingApp.id, 'correction_needed'); setViewingApp(null); }}
                      className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-sm text-amber-400 font-medium">
                      Demander Correction
                    </button>
                  )}
                  <button onClick={() => { handleAppStatus(viewingApp.id, 'approved'); setViewingApp(null); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25">
                    Approuver
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT PARTNER MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users2 size={20} className="text-brand-400" />
                  {editingPartner ? 'Modifier le Partenaire' : 'Nouveau Partenaire'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-[60px_1fr] gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Emoji</label>
                    <input type="text" value={form.logo_emoji} onChange={(e) => setForm({ ...form, logo_emoji: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-center text-2xl focus:outline-none focus:border-brand-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nom</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nom du partenaire..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description..." rows={2}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Catégorie</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Statut</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50">
                      {PARTNER_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Site web</label>
                  <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                    placeholder="https://..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Avantages (séparés par virgule)</label>
                  <input type="text" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    placeholder="Avantage 1, Avantage 2..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
              <div className="p-6 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm text-slate-300 font-medium transition-colors">
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving} onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {editingPartner ? 'Enregistrer' : 'Créer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRICING TAB */}
      {tab === 'pricing' && (
        <div className="space-y-6">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
            <p className="text-sm text-slate-400 mb-1">Définissez les prix pour chaque type de partenariat et durée.</p>
            <p className="text-xs text-slate-500">Les utilisateurs devront payer avant de soumettre leur demande.</p>
          </div>
          {['project', 'advertising'].map((pType) => {
            const typeLabel = pType === 'project' ? '🤝 Partenariat Projet' : '📢 Publicité / Bannière';
            const typePricing = pricing.filter(p => p.partnership_type === pType);
            return (
              <div key={pType} className="space-y-3">
                <h3 className="text-lg font-bold text-white">{typeLabel}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {typePricing.map((p) => {
                    const dLabel = p.duration_type === 'weekly' ? 'Hebdomadaire' : p.duration_type === 'monthly' ? 'Mensuel' : 'Annuel';
                    return (
                      <div key={p.id} className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{dLabel}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {p.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wide">Sidra (SDA)</label>
                            <input type="number" value={p.price_sidra} onChange={(e) => handlePricingUpdate(p.id, 'price_sidra', Number(e.target.value))}
                              className="w-full mt-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wide">SPTC</label>
                            <input type="number" value={p.price_sptc} onChange={(e) => handlePricingUpdate(p.id, 'price_sptc', Number(e.target.value))}
                              className="w-full mt-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wide">USD (Visa)</label>
                            <input type="number" value={p.price_usd} onChange={(e) => handlePricingUpdate(p.id, 'price_usd', Number(e.target.value))}
                              className="w-full mt-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {pricing.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-400 font-medium">Aucun tarif configuré</p>
              <p className="text-slate-500 text-sm mt-1">Exécutez la migration SQL pour initialiser les tarifs par défaut.</p>
            </div>
          )}
        </div>
      )}

      {/* BANNERS TAB */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Gérez les bannières publicitaires sponsorisées.</p>
              <p className="text-xs text-slate-500 mt-1">Les bannières actives seront affichées sur la plateforme.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setEditingBanner(null);
                setBannerForm({ title: '', description: '', image_url: '', video_url: '', media_type: 'image', autoplay: false, display_duration: 10, link_url: '', banner_type: 'large', starts_at: new Date().toISOString().split('T')[0], ends_at: '', priority: 0, partner_id: '' });
                setShowBannerModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25"
            >
              <Plus size={16} /> Nouvelle Bannière
            </motion.button>
          </div>

          <div className="space-y-3">
            {banners.map((banner) => {
              const isExpired = new Date(banner.ends_at) < new Date();
              const isRunning = banner.is_active && !isExpired && new Date(banner.starts_at) <= new Date();
              return (
                <motion.div
                  key={banner.id}
                  layout
                  className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.15] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {banner.media_type === 'video' && banner.video_url ? (
                      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.06] relative">
                        <video src={banner.video_url} muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play size={16} className="text-white" />
                        </div>
                        {banner.autoplay && (
                          <span className="absolute top-0.5 right-0.5 px-1 py-0.5 bg-brand-500/80 rounded text-[8px] font-bold text-white">AUTO</span>
                        )}
                      </div>
                    ) : banner.image_url ? (
                      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.06]">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{banner.title || 'Sans titre'}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isRunning ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          isExpired ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {isRunning ? 'EN COURS' : isExpired ? 'EXPIRÉ' : 'PLANIFIÉ'}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{banner.banner_type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          banner.media_type === 'video' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {banner.media_type === 'video' ? '🎬 Vidéo' : '🖼 Image'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                        <span>📅 {new Date(banner.starts_at).toLocaleDateString('fr-FR')} → {new Date(banner.ends_at).toLocaleDateString('fr-FR')}</span>
                        <span>👁 {banner.impressions} impressions</span>
                        <span>🖱 {banner.clicks} clics</span>
                        <span>⭐ Priorité: {banner.priority}</span>
                        <span>⏱ {banner.display_duration}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    <button onClick={() => handleToggleBanner(banner)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                        banner.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-white/[0.06] border-white/[0.1] text-slate-400 hover:bg-white/[0.1]'
                      }`}
                    >
                      {banner.is_active ? '✅ Actif' : '⏸ Inactif'}
                    </button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setEditingBanner(banner);
                        setBannerForm({
                          title: banner.title,
                          description: banner.description,
                          image_url: banner.image_url,
                          video_url: banner.video_url || '',
                          media_type: (banner.media_type || 'image') as 'image' | 'video',
                          autoplay: banner.autoplay ?? false,
                          display_duration: banner.display_duration || 10,
                          link_url: banner.link_url,
                          banner_type: banner.banner_type,
                          starts_at: banner.starts_at.split('T')[0],
                          ends_at: banner.ends_at.split('T')[0],
                          priority: banner.priority,
                          partner_id: banner.partner_id || '',
                        });
                        setShowBannerModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-xs text-slate-300">
                      <Edit3 size={13} /> Modifier
                    </motion.button>
                    <div className="flex-1" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      disabled={deletingId === banner.id}
                      onClick={() => { if (confirm('Supprimer cette bannière ?')) handleDeleteBanner(banner.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 disabled:opacity-50">
                      {deletingId === banner.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Supprimer
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
            {banners.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                  <ImageIcon size={28} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Aucune bannière</p>
                <p className="text-slate-500 text-sm mt-1">Créez une bannière pour les partenaires publicitaires</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANNER MODAL */}
      <AnimatePresence>
        {showBannerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBannerModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-brand-400" />
                  {editingBanner ? 'Modifier la Bannière' : 'Nouvelle Bannière'}
                </h3>
                <button onClick={() => setShowBannerModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Titre</label>
                  <input type="text" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="Titre de la bannière..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</label>
                  <textarea value={bannerForm.description} onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                    placeholder="Description..." rows={2}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 resize-none" />
                </div>

                {/* Media Type Selector */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">Type de média</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id: 'image' as const, label: 'Image', emoji: '🖼', desc: 'Image statique' },
                      { id: 'video' as const, label: 'Vidéo', emoji: '🎬', desc: 'Vidéo (MP4, WebM, YouTube)' },
                    ]).map((mt) => (
                      <button
                        key={mt.id}
                        type="button"
                        onClick={() => setBannerForm({ ...bannerForm, media_type: mt.id })}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          bannerForm.media_type === mt.id
                            ? 'bg-brand-500/10 border-brand-500/40 shadow-lg shadow-brand-500/5'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
                        }`}
                      >
                        <span className="text-xl mb-0.5 block">{mt.emoji}</span>
                        <p className="text-sm font-semibold text-white">{mt.label}</p>
                        <p className="text-[10px] text-slate-500">{mt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {bannerForm.media_type === 'image' && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">URL de l&#39;image *</label>
                    <input type="url" value={bannerForm.image_url} onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                      placeholder="https://..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                  </div>
                )}

                {bannerForm.media_type === 'video' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">URL de la vidéo *</label>
                      <input type="url" value={bannerForm.video_url} onChange={(e) => setBannerForm({ ...bannerForm, video_url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... ou https://example.com/video.mp4"
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                      <p className="text-[10px] text-slate-500 mt-1">Supporte YouTube, MP4, WebM. Pour YouTube, collez le lien complet.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Image de couverture (optionnel)</label>
                      <input type="url" value={bannerForm.image_url} onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                        placeholder="https://... (thumbnail affichée avant lecture)"
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                    </div>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      bannerForm.autoplay ? 'bg-brand-500/10 border-brand-500/40' : 'bg-white/[0.03] border-white/[0.08]'
                    }`}>
                      <input type="checkbox" checked={bannerForm.autoplay}
                        onChange={(e) => setBannerForm({ ...bannerForm, autoplay: e.target.checked })}
                        className="sr-only" />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        bannerForm.autoplay ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
                      }`}>
                        {bannerForm.autoplay && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                        <span className="text-sm text-white font-medium">Lecture automatique</span>
                        <p className="text-[10px] text-slate-500">La vidéo se lancera automatiquement (muet) quand visible</p>
                      </div>
                    </label>
                  </>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Lien de redirection</label>
                  <input type="url" value={bannerForm.link_url} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                    placeholder="https://..." className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Type de bannière</label>
                    <select value={bannerForm.banner_type} onChange={(e) => setBannerForm({ ...bannerForm, banner_type: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50">
                      <option value="large">Grande</option>
                      <option value="medium">Moyenne</option>
                      <option value="small">Petite</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Priorité</label>
                    <input type="number" value={bannerForm.priority} onChange={(e) => setBannerForm({ ...bannerForm, priority: Number(e.target.value) })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Durée d&#39;affichage</label>
                    <div className="relative">
                      <input type="number" min={5} value={bannerForm.display_duration} onChange={(e) => setBannerForm({ ...bannerForm, display_duration: Math.max(5, Number(e.target.value)) })}
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">sec</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Date de début</label>
                    <input type="date" value={bannerForm.starts_at} onChange={(e) => setBannerForm({ ...bannerForm, starts_at: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Date de fin *</label>
                    <input type="date" value={bannerForm.ends_at} onChange={(e) => setBannerForm({ ...bannerForm, ends_at: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Partenaire associé (optionnel)</label>
                  <select value={bannerForm.partner_id} onChange={(e) => setBannerForm({ ...bannerForm, partner_id: e.target.value })}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50">
                    <option value="">Aucun</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.logo_emoji} {p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm text-slate-300 font-medium">
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving} onClick={handleSaveBanner}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {editingBanner ? 'Enregistrer' : 'Créer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
