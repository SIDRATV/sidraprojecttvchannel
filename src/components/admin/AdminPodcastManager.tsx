'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2, Plus, Trash2, Edit3, Save, X, Loader2, Youtube,
  Image as ImageIcon, Video, Star, StarOff, Search, RefreshCw, Eye,
} from 'lucide-react';
import { Card } from '@/components/ui';

interface Podcast {
  id: string;
  title: string;
  description: string;
  image: string;
  youtube_id?: string;
  duration: string;
  category: string;
  creator: string;
  views: number;
  likes: number;
  is_featured: boolean;
  created_at: string;
}

interface PageBanner {
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
}

interface Props { token: string; }

const CATEGORIES = ['Technologie', 'Business', 'IA & ML', 'Développement', 'Marketing', 'Design', 'Société', 'Sport', 'Autre'];

export function AdminPodcastManager({ token }: Props) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  // Banner state
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [bannerEdit, setBannerEdit] = useState(false);
  const [bannerForm, setBannerForm] = useState<PageBanner>({ type: 'image', url: '', title: '', subtitle: '' });
  const [bannerSaving, setBannerSaving] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', youtube_id: '', category: CATEGORIES[0], creator: '', duration: '', is_featured: false,
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState<Partial<Podcast & { youtube_id: string }>>({});

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [podRes, bannerRes] = await Promise.all([
        fetch('/api/admin/podcasts', { headers }),
        fetch('/api/page-banner?page=podcast'),
      ]);
      if (podRes.ok) {
        const d = await podRes.json();
        setPodcasts(d.podcasts ?? []);
      }
      if (bannerRes.ok) {
        const b = await bannerRes.json();
        if (b) setBanner(b);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ---- Banner ----
  const saveBanner = async () => {
    setBannerSaving(true);
    const res = await fetch('/api/page-banner', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ page: 'podcast', ...bannerForm }),
    });
    setBannerSaving(false);
    if (res.ok) {
      setBanner(bannerForm);
      setBannerEdit(false);
      flash('✓ Bannière mise à jour');
    } else {
      const d = await res.json();
      flash(`✗ ${d.error}`);
    }
  };

  // ---- Create ----
  const createPodcast = async () => {
    setCreateLoading(true);
    const res = await fetch('/api/admin/podcasts', { method: 'POST', headers, body: JSON.stringify(createForm) });
    setCreateLoading(false);
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ title: '', description: '', youtube_id: '', category: CATEGORIES[0], creator: '', duration: '', is_featured: false });
      flash('✓ Podcast créé');
      load();
    } else {
      const d = await res.json();
      flash(`✗ ${d.error}`);
    }
  };

  // ---- Edit ----
  const startEdit = (p: Podcast) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };
  const saveEdit = async () => {
    const res = await fetch('/api/admin/podcasts', { method: 'PATCH', headers, body: JSON.stringify(editForm) });
    if (res.ok) { setEditingId(null); flash('✓ Podcast modifié'); load(); }
    else { const d = await res.json(); flash(`✗ ${d.error}`); }
  };

  // ---- Delete ----
  const deletePodcast = async (id: string) => {
    if (!confirm('Supprimer ce podcast ?')) return;
    setDeletingId(id);
    await fetch('/api/admin/podcasts', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    setDeletingId(null);
    flash('✓ Podcast supprimé');
    load();
  };

  // ---- Toggle featured ----
  const toggleFeatured = async (p: Podcast) => {
    await fetch('/api/admin/podcasts', { method: 'PATCH', headers, body: JSON.stringify({ id: p.id, is_featured: !p.is_featured }) });
    load();
  };

  const filtered = podcasts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.creator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Flash message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('✓') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BANNER SECTION ── */}
      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon size={20} className="text-purple-400" />
            Bannière Podcast
          </h3>
          <button onClick={() => { setBannerEdit(true); setBannerForm(banner ?? { type: 'image', url: '', title: 'Podcasts', subtitle: 'Découvrez nos épisodes' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-all">
            <Edit3 size={14} /> Modifier
          </button>
        </div>

        {banner ? (
          <div className="relative h-36 rounded-xl overflow-hidden bg-slate-700">
            {banner.type === 'video' ? (
              <video src={banner.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-6">
              <div>
                <p className="text-white font-bold text-xl">{banner.title}</p>
                <p className="text-white/70 text-sm">{banner.subtitle}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-36 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Aucune bannière configurée</p>
          </div>
        )}

        <AnimatePresence>
          {bannerEdit && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type de bannière</label>
                  <select value={bannerForm.type} onChange={e => setBannerForm(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50">
                    <option value="image">Image (URL)</option>
                    <option value="video">Vidéo (URL mp4/webm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">URL {bannerForm.type === 'video' ? 'vidéo' : 'image'}</label>
                  <input value={bannerForm.url} onChange={e => setBannerForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titre</label>
                  <input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sous-titre</label>
                  <input value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveBanner} disabled={bannerSaving || !bannerForm.url}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                  {bannerSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
                <button onClick={() => setBannerEdit(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all">
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── PODCAST LIST ── */}
      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Mic2 size={18} className="text-purple-400" />
            Podcasts ({podcasts.length})
          </h3>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 w-32 sm:w-40" />
            </div>
            <button onClick={load} className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 text-white rounded-lg text-sm font-medium transition-all">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40">
              <p className="text-sm font-semibold text-white mb-3">Nouveau Podcast (YouTube)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titre *</label>
                  <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><Youtube size={12} /> YouTube ID *</label>
                  <input value={createForm.youtube_id} onChange={e => setCreateForm(f => ({ ...f, youtube_id: e.target.value }))}
                    placeholder="ex: dQw4w9WgXcQ" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Créateur *</label>
                  <input value={createForm.creator} onChange={e => setCreateForm(f => ({ ...f, creator: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Catégorie *</label>
                  <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Durée (ex: 45 min)</label>
                  <input value={createForm.duration} onChange={e => setCreateForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="45 min" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={createForm.is_featured} onChange={e => setCreateForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500" />
                    <span className="text-sm text-slate-300">Mettre en avant</span>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none" />
              </div>
              {/* YouTube preview */}
              {createForm.youtube_id && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-2">Aperçu miniature :</p>
                  <img src={`https://img.youtube.com/vi/${createForm.youtube_id}/mqdefault.jpg`} alt="preview" className="h-24 rounded-lg object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={createPodcast} disabled={createLoading || !createForm.title || !createForm.youtube_id || !createForm.creator}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                  {createLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Créer
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all">
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-purple-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-10">Aucun podcast trouvé</p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {filtered.map(p => (
              <div key={p.id}>
                {editingId === p.id ? (
                  <div className="px-6 py-4 bg-slate-900/40 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Titre</label>
                        <input value={editForm.title ?? ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">YouTube ID</label>
                        <input value={editForm.youtube_id ?? ''} onChange={e => setEditForm(f => ({ ...f, youtube_id: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Créateur</label>
                        <input value={editForm.creator ?? ''} onChange={e => setEditForm(f => ({ ...f, creator: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
                        <select value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Durée</label>
                        <input value={editForm.duration ?? ''} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-all">
                        <Save size={14} /> Enregistrer
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 sm:px-6 py-3 sm:py-4 hover:bg-slate-700/20 transition-all group">
                    <div className="relative w-16 h-11 sm:w-20 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      {p.youtube_id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Youtube size={16} className="text-red-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm truncate">{p.title}</p>
                        {p.is_featured && <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      </div>
                      <p className="text-slate-400 text-xs">{p.creator} · {p.category} · {p.duration}</p>
                      <p className="text-slate-500 text-xs">{p.views?.toLocaleString()} vues · {p.likes?.toLocaleString()} likes</p>
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {p.youtube_id && (
                        <a href={`https://youtube.com/watch?v=${p.youtube_id}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all">
                          <Eye size={14} />
                        </a>
                      )}
                      <button onClick={() => toggleFeatured(p)} className={`p-2 rounded-lg transition-all ${p.is_featured ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-slate-400 hover:bg-slate-700'}`}>
                        {p.is_featured ? <Star size={14} className="fill-yellow-400" /> : <StarOff size={14} />}
                      </button>
                      <button onClick={() => startEdit(p)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => deletePodcast(p.id)} disabled={deletingId === p.id}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all disabled:opacity-50">
                        {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
