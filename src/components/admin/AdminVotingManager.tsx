'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Target,
  Image as ImageIcon,
  Tag,
  FileText,
  Sparkles,
  Users,
} from 'lucide-react';

interface VotingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  funding_goal: number;
  funding_current: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  created_at: string;
}

const CATEGORIES = [
  'Éducation', 'Technologie', 'Social', 'Santé', 'Environnement',
  'Finance', 'Culture', 'Infrastructure', 'Agriculture', 'Énergie',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  { value: 'upcoming', label: 'À venir', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  { value: 'completed', label: 'Terminé', color: 'text-brand-400 bg-brand-500/20 border-brand-500/30' },
  { value: 'rejected', label: 'Rejeté', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
];

export function AdminVotingManager({ token }: { token: string }) {
  const [projects, setProjects] = useState<VotingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<VotingProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technologie',
    image_url: '',
    funding_goal: 0,
    status: 'active',
    ends_at: '',
  });

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/voting-projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement des projets' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'Technologie', image_url: '', funding_goal: 0, status: 'active', ends_at: '' });
    setEditingProject(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (project: VotingProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      category: project.category,
      image_url: project.image_url,
      funding_goal: project.funding_goal,
      status: project.status,
      ends_at: project.ends_at ? project.ends_at.split('T')[0] : '',
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
      const body = editingProject
        ? { projectId: editingProject.id, ...form, ends_at: form.ends_at || null }
        : { ...form, ends_at: form.ends_at || null };

      const res = await fetch('/api/admin/voting-projects', {
        method: editingProject ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: editingProject ? 'Projet mis à jour' : 'Projet créé avec succès' });
        setShowModal(false);
        resetForm();
        await fetchProjects();
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
      const res = await fetch(`/api/admin/voting-projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Projet supprimé' });
        await fetchProjects();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur de suppression' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/voting-projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Statut mis à jour' });
        await fetchProjects();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
  };

  const totalVotes = projects.reduce((s, p) => s + p.total_votes, 0);
  const activeCount = projects.filter(p => p.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Banner */}
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
            <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles size={24} className="text-brand-400" />
            Gestion des Projets de Vote
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length} projets · {activeCount} actifs · {totalVotes} votes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow"
        >
          <Plus size={18} />
          Nouveau Projet
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Projets', value: projects.length, icon: BarChart3, color: 'from-brand-500 to-emerald-400' },
          { label: 'Projets Actifs', value: activeCount, icon: Sparkles, color: 'from-emerald-500 to-green-400' },
          { label: 'Total Votes', value: totalVotes, icon: ThumbsUp, color: 'from-blue-500 to-cyan-400' },
          { label: 'Participants', value: totalVotes, icon: Users, color: 'from-purple-500 to-violet-400' },
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
              <p className="text-xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {projects.map((project) => {
          const statusInfo = STATUS_OPTIONS.find(s => s.value === project.status) || STATUS_OPTIONS[0];
          const votePercent = project.total_votes > 0 ? ((project.upvotes / project.total_votes) * 100).toFixed(1) : '0';

          return (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] overflow-hidden hover:border-white/[0.15] transition-colors"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Image */}
                  {project.image_url && (
                    <div className="w-full md:w-24 h-20 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${project.image_url})` }}
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{project.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> {project.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} className="text-emerald-400" /> {project.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown size={12} className="text-red-400" /> {project.downvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 size={12} /> {votePercent}% positif
                      </span>
                      {project.funding_goal > 0 && (
                        <span className="flex items-center gap-1">
                          <Target size={12} className="text-gold-400" /> {Number(project.funding_current).toLocaleString()} / {Number(project.funding_goal).toLocaleString()} SIDRA
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Vote bar */}
                    <div className="flex h-1.5 bg-white/5 rounded-full overflow-hidden mt-3 gap-px">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-l-full transition-all"
                        style={{ width: `${project.total_votes > 0 ? (project.upvotes / project.total_votes) * 100 : 50}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-r-full transition-all"
                        style={{ width: `${project.total_votes > 0 ? (project.downvotes / project.total_votes) * 100 : 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  {/* Status quick change */}
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value)}
                    className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>

                  <div className="flex-1" />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEdit(project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    <Edit3 size={13} />
                    Modifier
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={deletingId === project.id}
                    onClick={() => {
                      if (confirm('Supprimer ce projet ? Cette action est irréversible.')) {
                        handleDelete(project.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === project.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Supprimer
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
              <Sparkles size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Aucun projet de vote</p>
            <p className="text-slate-600 text-sm mt-1">Créez votre premier projet pour commencer</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
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
              {/* Modal header */}
              <div className="p-6 border-b border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-brand-400" />
                    {editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                    <FileText size={13} /> Titre
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Nom du projet..."
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                    <FileText size={13} /> Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez le projet en détail..."
                    rows={3}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Category & Status row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                      <Tag size={13} /> Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                      <BarChart3 size={13} /> Statut
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                    <ImageIcon size={13} /> Image URL
                  </label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>

                {/* Funding & End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                      <Target size={13} /> Objectif Financement (SIDRA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.funding_goal}
                      onChange={(e) => setForm({ ...form, funding_goal: Number(e.target.value) })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                      <Calendar size={13} /> Date de fin
                    </label>
                    <input
                      type="date"
                      value={form.ends_at}
                      onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-6 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm text-slate-300 font-medium transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {editingProject ? 'Enregistrer' : 'Créer le projet'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
