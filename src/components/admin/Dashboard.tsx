'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Upload,
  Grid3x3,
  TrendingUp,
  Menu,
  X,
  Video,
  Settings,
  Eye,
  Trash2,
  Plus,
  Search,
  Clock,
  Activity,
  Award,
  Film,
  Crown,
  Tag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { categoryService } from '@/services/categories';
import type { Category } from '@/types';

type Tab = 'overview' | 'users' | 'content' | 'categories' | 'analytics';

const COLORS = ['#0F7A5C', '#19C37D', '#D4AF37', '#8b5cf6', '#f59e0b'];

// ==================== SHARED FETCH HELPER ====================
async function adminFetch<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ==================== ADMIN DASHBOARD SHELL ====================
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Grid3x3 },
    { id: 'content', label: 'Vidéos Premium', icon: Film },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'analytics', label: 'Analytiques', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar — Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:bg-slate-900/60 lg:border-r lg:border-slate-800 lg:backdrop-blur-xl lg:z-40 lg:flex lg:flex-col">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-400 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/30">
              <Video size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Sidra Admin</h1>
              <p className="text-xs text-slate-400 font-medium">Chaîne TV</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab(id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                activeTab === id
                  ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </motion.button>
          ))}

          <Link
            href="/admin/upload-video"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gold-400 hover:bg-gold-500/10 border border-gold-500/20 hover:border-gold-500/40 transition-all font-medium text-sm mt-4"
          >
            <Upload size={18} />
            <span>Upload Vidéo</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-all font-medium text-sm"
          >
            <Settings size={18} />
            Retour à l'App
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-lg flex items-center justify-center text-white">
            <Video size={18} />
          </div>
          <span className="font-bold text-white text-sm">Sidra Admin</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 p-4 space-y-2"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as Tab); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{label}</span>
            </button>
          ))}
          <Link
            href="/admin/upload-video"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gold-400 hover:bg-gold-500/10 transition-all font-medium text-sm border border-gold-500/20"
          >
            <Upload size={18} />
            Upload Vidéo
          </Link>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 space-y-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-brand-100 to-white bg-clip-text text-transparent">
                Tableau de Bord
              </h1>
              <p className="text-slate-400 mt-1">Gérez votre plateforme de streaming</p>
            </div>
            <Link
              href="/admin/upload-video"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-white rounded-lg font-semibold text-sm w-fit shadow-lg shadow-gold-500/20 transition-all"
            >
              <Upload size={16} />
              Upload Vidéo Premium
            </Link>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ==================== OVERVIEW TAB ====================
function OverviewTab() {
  const { session } = useAuth();
  const [stats, setStats] = useState<{
    totalUsers: number;
    newUsersWeek: number;
    totalCategories: number;
    totalPremiumVideos: number;
    recentUsers: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    adminFetch<typeof stats>('/api/admin/stats', session.access_token).then((data) => {
      if (data) setStats(data);
      setLoading(false);
    });
  }, [session]);

  const statCards = [
    {
      label: 'Utilisateurs Totaux',
      value: loading ? '…' : (stats?.totalUsers ?? 0).toLocaleString(),
      icon: Users,
      color: 'from-brand-500 to-brand-400',
    },
    {
      label: 'Nouveaux (7 jours)',
      value: loading ? '…' : (stats?.newUsersWeek ?? 0).toLocaleString(),
      icon: Activity,
      color: 'from-green-500 to-emerald-400',
    },
    {
      label: 'Vidéos Premium',
      value: loading ? '…' : (stats?.totalPremiumVideos ?? 0).toLocaleString(),
      icon: Film,
      color: 'from-gold-500 to-gold-400',
    },
    {
      label: 'Catégories',
      value: loading ? '…' : (stats?.totalCategories ?? 0).toLocaleString(),
      icon: Tag,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="p-5 bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Users */}
      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity size={20} className="text-brand-400" />
          Derniers Utilisateurs Inscrits
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={28} className="animate-spin text-brand-400" />
          </div>
        ) : !stats?.recentUsers?.length ? (
          <p className="text-slate-400 text-center py-8">Aucun utilisateur trouvé</p>
        ) : (
          <div className="space-y-3">
            {stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-slate-700/20 hover:bg-slate-700/40 rounded-lg transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{u.full_name || 'Sans nom'}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {u.is_admin && (
                    <span className="block px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">Admin</span>
                  )}
                  <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/upload-video"
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-gold-500/10 to-gold-400/5 border border-gold-500/20 hover:border-gold-500/50 rounded-xl transition-all group text-center"
          >
            <Upload size={24} className="text-gold-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-white">Upload Vidéo</span>
          </Link>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-700/20 border border-slate-700/50 hover:border-brand-500/30 rounded-xl transition-all group text-center cursor-pointer">
            <Users size={24} className="text-brand-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-white">Utilisateurs</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-700/20 border border-slate-700/50 hover:border-purple-500/30 rounded-xl transition-all group text-center cursor-pointer">
            <Tag size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-white">Catégories</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== CONTENT TAB ====================
function ContentTab() {
  const { session } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    const res = await fetch('/api/premium-videos?limit=50');
    if (res.ok) {
      const data = await res.json();
      setVideos(data.videos ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const handleDelete = async (id: string) => {
    if (!session?.access_token || !confirm('Supprimer cette vidéo définitivement ?')) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/upload-video/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id));
    setDeletingId(null);
  };

  const filtered = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : videos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une vidéo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        <Link
          href="/admin/upload-video"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-white rounded-lg font-medium text-sm w-full md:w-fit shadow-lg shadow-gold-500/20 transition-all"
        >
          <Plus size={18} />
          Nouvelle Vidéo Premium
        </Link>
      </div>

      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Film size={48} className="text-slate-600" />
            <p className="text-slate-400 font-medium">
              {searchQuery ? 'Aucun résultat' : 'Aucune vidéo premium uploadée'}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/upload-video"
                className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-white rounded-lg text-sm font-medium transition-all"
              >
                Uploader la première vidéo
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Titre</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Plan</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Qualités</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Vues</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((video) => (
                  <tr key={video.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-14 h-9 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-9 rounded bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                            <Film size={14} className="text-slate-500" />
                          </div>
                        )}
                        <p className="text-white font-medium line-clamp-1 max-w-[180px]">{video.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gold-500/20 text-gold-400 rounded text-xs font-medium uppercase">
                        {video.min_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {(video.quality_options || []).map((q: string) => (
                          <span key={q} className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs">{q}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Eye size={14} />
                        {(video.views || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(video.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/premium-videos/${video.id}`} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                          <Eye size={14} className="text-brand-400" />
                        </Link>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deletingId === video.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingId === video.id ? (
                            <Loader2 size={14} className="text-red-400 animate-spin" />
                          ) : (
                            <Trash2 size={14} className="text-red-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== USERS TAB ====================
function UsersTab() {
  const { session } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totals, setTotals] = useState({ totalUsers: 0, newUsersWeek: 0 });

  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;
    Promise.all([
      adminFetch<any>('/api/admin/users?limit=50', token),
      adminFetch<any>('/api/admin/stats', token),
    ]).then(([usersData, statsData]) => {
      if (usersData) setUsers(usersData.users ?? []);
      if (statsData) setTotals({ totalUsers: statsData.totalUsers, newUsersWeek: statsData.newUsersWeek });
      setLoading(false);
    });
  }, [session]);

  const filtered = searchQuery
    ? users.filter(
        (u) =>
          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : users;

  const statsCards = [
    { label: 'Utilisateurs Totaux', value: totals.totalUsers, icon: Users, color: 'text-brand-400' },
    { label: 'Nouveaux (7j)', value: totals.newUsersWeek, icon: Activity, color: 'text-green-400' },
    { label: 'Affichés', value: filtered.length, icon: Eye, color: 'text-purple-400' },
    { label: 'Admins', value: users.filter((u) => u.is_admin).length, icon: Award, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="p-4 bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{loading ? '…' : stat.value.toLocaleString()}</p>
                  </div>
                  <Icon size={24} className={stat.color} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher des utilisateurs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500/50 transition-all"
        />
      </div>

      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Aucun utilisateur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Utilisateur</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Plan</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Rôle</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white font-medium">{u.full_name || u.username || 'Sans nom'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.premium_plan ? (
                        <span className="px-2 py-1 bg-gold-500/20 text-gold-400 rounded text-xs font-medium uppercase">{u.premium_plan}</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs font-medium">Gratuit</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_admin ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Admin</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs font-medium">Membre</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm">
        {loading ? 'Chargement…' : `${categories.length} catégories dans Supabase`}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5 bg-slate-800/30 border border-slate-700/50 hover:border-brand-500/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#888' }} />
                    <h3 className="font-bold text-white">{cat.name}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{cat.icon}</span>
                </div>
                {cat.description && (
                  <p className="text-slate-400 text-xs line-clamp-2 mt-1">{cat.description}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ANALYTICS TAB ====================
function AnalyticsTab() {
  const weeklyViews = [
    { date: 'Lun', vues: 4000 },
    { date: 'Mar', vues: 3000 },
    { date: 'Mer', vues: 5200 },
    { date: 'Jeu', vues: 2780 },
    { date: 'Ven', vues: 3890 },
    { date: 'Sam', vues: 4390 },
    { date: 'Dim', vues: 6490 },
  ];

  const planData = [
    { name: 'Gratuit', value: 60 },
    { name: 'Pro', value: 25 },
    { name: 'Premium', value: 10 },
    { name: 'VIP', value: 5 },
  ];

  return (
    <div className="space-y-8">
      <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 text-xs flex items-center gap-2">
        <AlertCircle size={14} className="flex-shrink-0" />
        Les graphiques ci-dessous sont illustratifs. Les analytics temps-réel seront disponibles dans une prochaine version.
      </div>

      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-400" />
          Vues cette semaine
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={weeklyViews}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="vues" stroke="#0F7A5C" fill="#0F7A5C" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Crown size={20} className="text-gold-400" />
          Répartition des Plans (estimé)
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 min-w-[140px]">
            {planData.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300 text-sm">{item.name}</span>
                </div>
                <span className="font-semibold text-brand-400 text-sm">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
