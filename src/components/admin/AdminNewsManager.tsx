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
  BarChart3,
  Image as ImageIcon,
  Tag,
  FileText,
  Sparkles,
  Heart,
  MessageCircle,
  Newspaper,
  Star,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  image_url: string;
  read_time: number;
  featured: boolean;
  status: string;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const CATEGORIES = [
  'Blockchain', 'Technologie', 'Finance', 'Communauté', 'Partenariat',
  'Mise à jour', 'Éducation', 'Événement', 'General',
];

const STATUS_OPTIONS = [
  { value: 'published', label: 'Publié', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  { value: 'draft', label: 'Brouillon', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  { value: 'archived', label: 'Archivé', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
];

export function AdminNewsManager({ token }: { token: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'General',
    author: 'Rédaction Sidra',
    image_url: '',
    read_time: 3,
    featured: false,
    status: 'published',
  });

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/news-articles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement des articles' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const resetForm = () => {
    setForm({ title: '', description: '', content: '', category: 'General', author: 'Rédaction Sidra', image_url: '', read_time: 3, featured: false, status: 'published' });
    setEditingArticle(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      description: article.description,
      content: article.content,
      category: article.category,
      author: article.author,
      image_url: article.image_url,
      read_time: article.read_time,
      featured: article.featured,
      status: article.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Titre et description requis' });
      return;
    }
    setSaving(true);
    try {
      if (editingArticle) {
        await fetch('/api/admin/news-articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ articleId: editingArticle.id, ...form }),
        });
        setMessage({ type: 'success', text: 'Article mis à jour' });
      } else {
        await fetch('/api/admin/news-articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Article créé' });
      }
      setShowModal(false);
      resetForm();
      await fetchArticles();
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/news-articles?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: 'Article supprimé' });
      await fetchArticles();
    } catch {
      setMessage({ type: 'error', text: 'Erreur de suppression' });
    } finally {
      setDeletingId(null);
    }
  };

  const quickStatusChange = async (article: NewsArticle, newStatus: string) => {
    try {
      await fetch('/api/admin/news-articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ articleId: article.id, status: newStatus }),
      });
      await fetchArticles();
    } catch {
      setMessage({ type: 'error', text: 'Erreur de mise à jour' });
    }
  };

  const toggleFeatured = async (article: NewsArticle) => {
    try {
      await fetch('/api/admin/news-articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ articleId: article.id, featured: !article.featured }),
      });
      await fetchArticles();
    } catch {
      setMessage({ type: 'error', text: 'Erreur de mise à jour' });
    }
  };

  // Stats
  const total = articles.length;
  const published = articles.filter((a) => a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;
  const totalLikes = articles.reduce((s, a) => s + a.likes_count, 0);
  const totalComments = articles.reduce((s, a) => s + a.comments_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-400" size={32} />
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
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border backdrop-blur-xl ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: total, icon: Newspaper, color: 'text-brand-400' },
          { label: 'Publiés', value: published, icon: Eye, color: 'text-emerald-400' },
          { label: 'Brouillons', value: drafts, icon: EyeOff, color: 'text-amber-400' },
          { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-red-400' },
          { label: 'Commentaires', value: totalComments, icon: MessageCircle, color: 'text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Create Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openCreate}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20"
      >
        <Plus size={16} /> Nouvel Article
      </motion.button>

      {/* Articles List */}
      <div className="space-y-3">
        {articles.map((article) => {
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === article.status);
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.15] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Image thumb */}
                {article.image_url ? (
                  <div className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${article.image_url})` }} />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Newspaper size={20} className="text-orange-400/50" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{article.title}</h4>
                    {article.featured && (
                      <Star size={14} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{article.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-lg border text-xs font-medium ${statusOpt?.color || 'text-slate-400 bg-slate-500/20 border-slate-500/30'}`}>
                      {statusOpt?.label || article.status}
                    </span>
                    <span className="text-slate-600">{article.category}</span>
                    <span className="text-slate-600 flex items-center gap-1"><BookOpen size={10} /> {article.read_time}m</span>
                    <span className="text-red-400 flex items-center gap-1"><Heart size={10} /> {article.likes_count}</span>
                    <span className="text-blue-400 flex items-center gap-1"><MessageCircle size={10} /> {article.comments_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Quick status buttons */}
                  {article.status !== 'published' && (
                    <button onClick={() => quickStatusChange(article, 'published')} className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                      Publier
                    </button>
                  )}
                  {article.status === 'published' && (
                    <button onClick={() => quickStatusChange(article, 'archived')} className="px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded-lg border border-slate-500/30 hover:bg-slate-500/30 transition-colors">
                      Archiver
                    </button>
                  )}
                  <button onClick={() => toggleFeatured(article)} className={`p-1.5 rounded-lg border transition-colors ${article.featured ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-500 border-white/10 hover:text-amber-400'}`}>
                    <Star size={14} fill={article.featured ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => openEdit(article)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white border border-white/10 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deletingId === article.id}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 border border-red-500/20 transition-colors disabled:opacity-40"
                  >
                    {deletingId === article.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {articles.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun article. Cliquez sur &quot;Nouvel Article&quot; pour commencer.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-400" />
                  {editingArticle ? 'Modifier l\'article' : 'Nouvel Article'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><FileText size={12} /> Titre</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                    placeholder="Titre de l'article"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description courte</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 resize-none"
                    placeholder="Résumé de l'article"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Contenu</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 resize-none"
                    placeholder="Contenu complet de l'article (séparez les paragraphes par des lignes vides)"
                  />
                </div>

                {/* Row: Category + Author */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Tag size={12} /> Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-orange-500/50"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Auteur</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                      placeholder="Auteur"
                    />
                  </div>
                </div>

                {/* Row: Image URL + Read Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><ImageIcon size={12} /> URL Image</label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Clock size={12} /> Temps de lecture (min)</label>
                    <input
                      type="number"
                      value={form.read_time}
                      onChange={(e) => setForm({ ...form, read_time: parseInt(e.target.value) || 1 })}
                      min={1}
                      max={60}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                {/* Row: Status + Featured */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Statut</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-orange-500/50"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-slate-300 flex items-center gap-1"><Star size={14} className="text-amber-400" /> À la une</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {editingArticle ? 'Mettre à jour' : 'Créer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
