'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Plus, Trash2, Edit3, Save, X, Loader2, Youtube,
  Image as ImageIcon, Link2, Star, StarOff, Search, RefreshCw,
  CheckCircle, XCircle, Wifi, WifiOff,
} from 'lucide-react';
import { Card } from '@/components/ui';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  image: string;
  stream_url?: string;
  youtube_id?: string;
  stream_type?: 'youtube' | 'obs' | 'other';
  viewers: number;
  category: string;
  streamer: string;
  is_live: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface PageBanner {
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
}

interface Props { token: string; }

const CATEGORIES = ['Conférence', 'Atelier', 'Éducation', 'Podcast', 'Événement', 'Design', 'Développement', 'Sport', 'Autre'];

export function AdminLiveManager({ token }: Props) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  // Banner
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [bannerEdit, setBannerEdit] = useState(false);
  const [bannerForm, setBannerForm] = useState<PageBanner>({ type: 'image', url: '', title: '', subtitle: '' });
  const [bannerSaving, setBannerSaving] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', stream_url: '', stream_type: 'youtube' as 'youtube' | 'obs' | 'other',
    category: CATEGORIES[0], streamer: '', is_live: false, is_featured: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LiveStream>>({});

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [streamRes, bannerRes] = await Promise.all([
        fetch('/api/admin/live', { headers }),
        fetch('/api/page-banner?page=live'),
      ]);
      if (streamRes.ok) {
        const d = await streamRes.json();
        setStreams(d.streams ?? []);
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
      body: JSON.stringify({ page: 'live', ...bannerForm }),
    });
    setBannerSaving(false);
    if (res.ok) { setBanner(bannerForm); setBannerEdit(false); flash('✓ Bannière mise à jour'); }
    else { const d = await res.json(); flash(`✗ ${d.error}`); }
  };

  // ---- Create ----
  const createStream = async () => {
    setCreateLoading(true);
    const res = await fetch('/api/admin/live', { method: 'POST', headers, body: JSON.stringify(createForm) });
    setCreateLoading(false);
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ title: '', description: '', stream_url: '', stream_type: 'youtube', category: CATEGORIES[0], streamer: '', is_live: false, is_featured: false });
      flash('✓ Live créé');
      load();
    } else {
      const d = await res.json();
      flash(`✗ ${d.error}`);
    }
  };

  // ---- Edit ----
  const startEdit = (s: LiveStream) => { setEditingId(s.id); setEditForm({ ...s }); };
  const saveEdit = async () => {
    const res = await fetch('/api/admin/live', { method: 'PATCH', headers, body: JSON.stringify(editForm) });
    if (res.ok) { setEditingId(null); flash('✓ Live modifié'); load(); }
    else { const d = await res.json(); flash(`✗ ${d.error}`); }
  };

  // ---- Delete ----
  const deleteStream = async (id: string) => {
    if (!confirm('Supprimer ce live ?')) return;
    setDeletingId(id);
    await fetch('/api/admin/live', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    setDeletingId(null);
    flash('✓ Live supprimé');
    load();
  };

  // ---- Toggle live ----
  const toggleLive = async (s: LiveStream) => {
    await fetch('/api/admin/live', { method: 'PATCH', headers, body: JSON.stringify({ id: s.id, is_live: !s.is_live }) });
    load();
  };

  // ---- Toggle featured ----
  const toggleFeatured = async (s: LiveStream) => {
    await fetch('/api/admin/live', { method: 'PATCH', headers, body: JSON.stringify({ id: s.id, is_featured: !s.is_featured }) });
    load();
  };

  // Extract YouTube ID preview
  const getYtId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const filtered = streams.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.streamer.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = streams.filter(s => s.is_live).length;

  return (
    <div className="space-y-6">
      {/* Flash */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('✓') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total Lives', value: streams.length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'En direct', value: liveCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'En vedette', value: streams.filter(s => s.is_featured).length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(stat => (
          <Card key={stat.label} className={`p-3 sm:p-4 ${stat.bg} border border-slate-700/50`}>
            <p className="text-slate-400 text-xs">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* ── BANNER ── */}
      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon size={20} className="text-red-400" />
            Bannière Live
          </h3>
          <button onClick={() => { setBannerEdit(true); setBannerForm(banner ?? { type: 'image', url: '', title: 'Live Streams', subtitle: 'Regardez en direct' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full text-white text-xs font-bold">
                    <Radio size={10} /> LIVE
                  </span>
                </div>
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
                    <option value="image">Image (URL)</option>
                    <option value="video">Vidéo (URL mp4/webm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">URL {bannerForm.type === 'video' ? 'vidéo' : 'image'}</label>
                  <input value={bannerForm.url} onChange={e => setBannerForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titre</label>
                  <input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sous-titre</label>
                  <input value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveBanner} disabled={bannerSaving || !bannerForm.url}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
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

      {/* ── STREAM LIST ── */}
      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-white flex items-center gap-2 flex-wrap">
            <Radio size={18} className="text-red-400" />
            Lives ({streams.length})
            {liveCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {liveCount} en direct
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 w-32 sm:w-40" />
            </div>
            <button onClick={load} className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-sm font-medium transition-all">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40">
              <p className="text-sm font-semibold text-white mb-3">Nouveau Live</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titre *</label>
                  <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type de stream</label>
                  <select value={createForm.stream_type} onChange={e => setCreateForm(f => ({ ...f, stream_type: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
                    <option value="youtube">YouTube (lien watch ou live)</option>
                    <option value="obs">OBS / RTMP (URL HLS)</option>
                    <option value="other">Autre (iframe embed)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Link2 size={12} />
                    {createForm.stream_type === 'youtube' ? 'Lien YouTube *' : createForm.stream_type === 'obs' ? 'URL HLS/M3U8 *' : 'URL du stream *'}
                  </label>
                  <input value={createForm.stream_url} onChange={e => setCreateForm(f => ({ ...f, stream_url: e.target.value }))}
                    placeholder={createForm.stream_type === 'youtube' ? 'https://youtube.com/live/xxx ou https://youtube.com/watch?v=xxx' : 'https://...'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Streamer *</label>
                  <input value={createForm.streamer} onChange={e => setCreateForm(f => ({ ...f, streamer: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Catégorie *</label>
                  <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={createForm.is_live} onChange={e => setCreateForm(f => ({ ...f, is_live: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500" />
                    <span className="text-sm text-slate-300">En direct maintenant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={createForm.is_featured} onChange={e => setCreateForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-yellow-500" />
                    <span className="text-sm text-slate-300">En vedette</span>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none" />
              </div>
              {/* YouTube preview */}
              {createForm.stream_type === 'youtube' && createForm.stream_url && getYtId(createForm.stream_url) && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-2">Aperçu miniature :</p>
                  <img src={`https://img.youtube.com/vi/${getYtId(createForm.stream_url)}/mqdefault.jpg`} alt="preview" className="h-24 rounded-lg object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={createStream} disabled={createLoading || !createForm.title || !createForm.stream_url || !createForm.streamer}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
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
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-red-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-10">Aucun live trouvé</p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {filtered.map(s => (
              <div key={s.id}>
                {editingId === s.id ? (
                  <div className="px-6 py-4 bg-slate-900/40 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Titre</label>
                        <input value={editForm.title ?? ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">URL du stream</label>
                        <input value={editForm.stream_url ?? ''} onChange={e => setEditForm(f => ({ ...f, stream_url: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Streamer</label>
                        <input value={editForm.streamer ?? ''} onChange={e => setEditForm(f => ({ ...f, streamer: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
                        <select value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.is_live ?? false} onChange={e => setEditForm(f => ({ ...f, is_live: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500" />
                        <span className="text-sm text-slate-300">En direct</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.is_featured ?? false} onChange={e => setEditForm(f => ({ ...f, is_featured: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-yellow-500" />
                        <span className="text-sm text-slate-300">En vedette</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all">
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
                      {s.image ? (
                        <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Radio size={20} className="text-slate-500" />
                        </div>
                      )}
                      {s.is_live && (
                        <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 bg-red-500 rounded text-white text-xs font-bold leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm truncate">{s.title}</p>
                        {s.is_featured && <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      </div>
                      <p className="text-slate-400 text-xs">{s.streamer} · {s.category}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        {s.stream_type === 'youtube' ? <Youtube size={10} className="text-red-400" /> : <Link2 size={10} />}
                        {s.stream_url ? s.stream_url.substring(0, 40) + '...' : 'Aucun lien'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleLive(s)} title={s.is_live ? 'Arrêter le live' : 'Démarrer le live'}
                        className={`p-2 rounded-lg transition-all ${s.is_live ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:bg-slate-700'}`}>
                        {s.is_live ? <Wifi size={14} /> : <WifiOff size={14} />}
                      </button>
                      <button onClick={() => toggleFeatured(s)}
                        className={`p-2 rounded-lg transition-all ${s.is_featured ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-slate-400 hover:bg-slate-700'}`}>
                        {s.is_featured ? <Star size={14} className="fill-yellow-400" /> : <StarOff size={14} />}
                      </button>
                      <button onClick={() => startEdit(s)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => deleteStream(s.id)} disabled={deletingId === s.id}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all disabled:opacity-50">
                        {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
