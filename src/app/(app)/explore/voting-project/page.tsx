'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Users,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  Sparkles,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface VotingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  funding_goal: number;
  funding_current: number;
  status: 'active' | 'upcoming' | 'completed';
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

function getDaysLeft(endsAt: string | null): number {
  if (!endsAt) return -1;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function VotingProjectPage() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<VotingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/voting-projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((p) =>
    filterStatus === 'all' ? true : p.status === filterStatus
  );

  const handleVote = async (projectId: string, voteType: 'up' | 'down') => {
    if (!session?.access_token) return;
    setVotingLoading(projectId);
    try {
      const res = await fetch('/api/voting-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ projectId, voteType }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.action === 'removed') {
          setUserVotes((prev) => ({ ...prev, [projectId]: null }));
        } else {
          setUserVotes((prev) => ({ ...prev, [projectId]: voteType }));
        }
        await fetchProjects();
      }
    } catch {
      // silently fail
    } finally {
      setVotingLoading(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  const totalVotesAll = projects.reduce((s, p) => s + p.total_votes, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={40} className="text-brand-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1a14] to-slate-950 p-4 md:p-8 overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-gold-500/8 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
        className="mb-10 relative"
      >
        <div className="flex items-center gap-4 mb-3">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-14 h-14 bg-gradient-to-br from-brand-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30"
          >
            <Sparkles className="text-white" size={28} />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-brand-400 to-emerald-300 bg-clip-text text-transparent">
              Projets Communautaires
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Votez pour les projets qui comptent pour la communauté Sidra
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs — Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 md:gap-3 mb-8 flex-wrap"
      >
        {([
          { key: 'all', label: 'Tous', icon: BarChart3 },
          { key: 'active', label: 'Actifs', icon: Zap },
          { key: 'upcoming', label: 'À venir', icon: Calendar },
          { key: 'completed', label: 'Terminés', icon: CheckCircle2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all border backdrop-blur-xl ${
              filterStatus === key
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/40 shadow-lg shadow-brand-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={15} />
            {label}
          </motion.button>
        ))}
      </motion.div>

      {/* Stats Row — Glassmorphism Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10"
      >
        {[
          { label: 'Projets Totaux', value: projects.length, icon: Award, color: 'from-brand-500 to-emerald-400' },
          { label: 'Votes Actifs', value: totalVotesAll, icon: ThumbsUp, color: 'from-blue-500 to-cyan-400' },
          { label: 'Terminés', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle2, color: 'from-emerald-500 to-green-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative group"
            >
              {/* Glass card */}
              <div className="relative bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-5 border border-white/[0.08] overflow-hidden">
                {/* Glow accent */}
                <div className={`absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
                    <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="text-white" size={15} />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, idx) => {
            const totalVotes = project.total_votes || 1;
            const votePercentage = totalVotes > 0 ? (project.upvotes / totalVotes) * 100 : 50;
            const daysLeft = getDaysLeft(project.ends_at);
            const userVote = userVotes[project.id];
            const isVoting = votingLoading === project.id;

            return (
              <motion.div
                key={project.id}
                variants={itemVariants}
                layout
                whileHover={{ y: -6 }}
                onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                className="relative group cursor-pointer"
              >
                {/* Outer glow on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-brand-500/20 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

                {/* Glass card */}
                <div className={`relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl overflow-hidden border transition-all ${
                  selectedProject === project.id
                    ? 'border-brand-500/50 shadow-lg shadow-brand-500/10'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}>
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {project.image_url ? (
                      <div
                        className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url(${project.image_url})` }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-500/30 to-emerald-500/20 flex items-center justify-center">
                        <Sparkles size={48} className="text-brand-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl border ${
                          project.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : project.status === 'upcoming'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                        }`}
                      >
                        {project.status === 'active' ? 'ACTIF' : project.status === 'upcoming' ? 'À VENIR' : 'TERMINÉ'}
                      </motion.span>
                    </div>

                    {/* Category */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl text-white text-xs font-semibold rounded-full border border-white/20">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-5 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Vote Progress Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Vote Communautaire
                        </p>
                        <p className="text-xs text-slate-500">
                          {project.total_votes.toLocaleString()} votes
                        </p>
                      </div>
                      <div className="flex h-2.5 bg-white/5 rounded-full overflow-hidden gap-px">
                        <motion.div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-l-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${votePercentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1, type: 'spring' }}
                        />
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-r-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${100 - votePercentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1, type: 'spring' }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ThumbsUp size={11} /> {votePercentage.toFixed(1)}%
                        </span>
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <ThumbsDown size={11} /> {(100 - votePercentage).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Info Row — Glass pills */}
                    <div className="flex gap-3 mb-5">
                      <div className="flex-1 bg-white/[0.04] backdrop-blur-xl rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                          <Clock size={11} /> Jours restants
                        </p>
                        <p className="text-base font-bold text-white">
                          {daysLeft < 0 ? '∞' : daysLeft === 0 ? 'Terminé' : daysLeft}
                        </p>
                      </div>
                      <div className="flex-1 bg-white/[0.04] backdrop-blur-xl rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                          <Users size={11} /> Participants
                        </p>
                        <p className="text-base font-bold text-white">
                          {project.total_votes.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    {project.status === 'active' && (
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={isVoting || !session}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(project.id, 'up');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all border backdrop-blur-xl ${
                            userVote === 'up'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {isVoting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                          {project.upvotes.toLocaleString()}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={isVoting || !session}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(project.id, 'down');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all border backdrop-blur-xl ${
                            userVote === 'down'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-500/10'
                              : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {isVoting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                          {project.downvotes.toLocaleString()}
                        </motion.button>
                      </div>
                    )}

                    {/* Completed badge */}
                    {project.status === 'completed' && (
                      <div className="flex items-center gap-2 py-3 px-4 bg-brand-500/10 rounded-xl border border-brand-500/20">
                        <CheckCircle2 size={16} className="text-brand-400" />
                        <span className="text-sm font-medium text-brand-300">Projet terminé avec succès</span>
                      </div>
                    )}

                    {!session && project.status === 'active' && (
                      <p className="text-xs text-slate-500 text-center mt-3">
                        Connectez-vous pour voter
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-white/[0.04] backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/[0.08]">
            <Award size={36} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">Aucun projet dans cette catégorie</p>
          <p className="text-slate-600 text-sm mt-2">Les projets apparaîtront ici une fois créés par l&apos;administration</p>
        </motion.div>
      )}
    </div>
  );
}
