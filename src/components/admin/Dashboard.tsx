'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Shield,
  Wallet,
  DollarSign,
  UserCog,
  Ban,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  UserX,
  Bell,
  Send,
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
import { GasFeeManager } from '@/components/admin/GasFeeManager';
import type { Category } from '@/types';

type Tab = 'overview' | 'users' | 'content' | 'categories' | 'analytics' | 'admins' | 'finances' | 'security';

const COLORS = ['#0F7A5C', '#19C37D', '#D4AF37', '#8b5cf6', '#f59e0b', '#ef4444'];

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

async function adminPost(url: string, token: string, body: object): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
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
    { id: 'admins', label: 'Gestion Admins', icon: UserCog },
    { id: 'finances', label: 'Finances', icon: DollarSign },
    { id: 'security', label: 'Sécurité', icon: Shield },
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isDanger = id === 'security';
            const isFinance = id === 'finances';
            const isAdminTab = id === 'admins';
            const accent = isDanger
              ? isActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-red-500/10 hover:text-red-300'
              : isFinance
              ? isActive ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-slate-400 hover:bg-gold-500/10 hover:text-gold-300'
              : isAdminTab
              ? isActive ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-purple-500/10 hover:text-purple-300'
              : isActive
              ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-lg shadow-brand-500/25'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white';
            return (
              <motion.button
                key={id}
                whileHover={{ x: 3 }}
                onClick={() => setActiveTab(id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${accent}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </motion.button>
            );
          })}

          <Link
            href="/admin/upload-video"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gold-400 hover:bg-gold-500/10 border border-gold-500/20 hover:border-gold-500/40 transition-all font-medium text-sm mt-3"
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 p-4 space-y-1 max-h-[80vh] overflow-y-auto"
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
      </AnimatePresence>

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
            {activeTab === 'admins' && <AdminsTab />}
            {activeTab === 'finances' && <FinancesTab />}
            {activeTab === 'security' && <SecurityTab />}
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
  const [actionModal, setActionModal] = useState<{ userId: string; action: string; email: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadUsers = useCallback(async () => {
    if (!session?.access_token) return;
    const token = session.access_token;
    const [usersData, statsData] = await Promise.all([
      adminFetch<any>('/api/admin/users?limit=100', token),
      adminFetch<any>('/api/admin/stats', token),
    ]);
    if (usersData) setUsers(usersData.users ?? []);
    if (statsData) setTotals({ totalUsers: statsData.totalUsers, newUsersWeek: statsData.newUsersWeek });
    setLoading(false);
  }, [session]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAction = (userId: string, action: string, email: string) => {
    setActionModal({ userId, action, email });
    setActionReason('');
    setActionMsg('');
  };

  const confirmAction = async () => {
    if (!actionModal || !session?.access_token) return;
    setActionLoading(true);
    const { ok, data } = await adminPost('/api/admin/user-actions', session.access_token, {
      user_id: actionModal.userId,
      action: actionModal.action,
      reason: actionReason,
    });
    setActionLoading(false);
    if (ok) {
      setActionMsg('✓ Action effectuée avec succès');
      loadUsers();
      setTimeout(() => setActionModal(null), 1500);
    } else {
      setActionMsg(`✗ Erreur: ${data?.error ?? 'Inconnue'}`);
    }
  };

  const filtered = searchQuery
    ? users.filter((u) => [(u.email || ''), (u.full_name || ''), (u.username || '')].some(f => f.toLowerCase().includes(searchQuery.toLowerCase())))
    : users;

  const statsCards = [
    { label: 'Utilisateurs Totaux', value: totals.totalUsers, icon: Users, color: 'text-brand-400' },
    { label: 'Nouveaux (7j)', value: totals.newUsersWeek, icon: Activity, color: 'text-green-400' },
    { label: 'Affichés', value: filtered.length, icon: Eye, color: 'text-purple-400' },
    { label: 'Admins', value: users.filter((u) => u.is_admin).length, icon: Award, color: 'text-red-400' },
  ];

  const actionLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    block: { label: 'Bloquer', color: 'text-orange-400 hover:bg-orange-500/10', icon: Ban },
    unblock: { label: 'Débloquer', color: 'text-green-400 hover:bg-green-500/10', icon: Unlock },
    warn: { label: 'Avertir', color: 'text-yellow-400 hover:bg-yellow-500/10', icon: AlertTriangle },
    delete: { label: 'Supprimer', color: 'text-red-400 hover:bg-red-500/10', icon: UserX },
  };

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
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Utilisateur</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Plan</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Statut</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Inscription</th>
                  <th className="px-4 py-4 text-left font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-700/20 transition-colors ${(u as any).is_blocked ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white font-medium">{u.full_name || u.username || 'Sans nom'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-4 py-4">
                      {u.premium_plan ? (
                        <span className="px-2 py-1 bg-gold-500/20 text-gold-400 rounded text-xs font-medium uppercase">{u.premium_plan}</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs font-medium">Gratuit</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {u.is_admin && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium mr-1">Admin</span>}
                      {(u as any).is_blocked
                        ? <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Bloqué</span>
                        : <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Actif</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {Object.entries(actionLabels).map(([act, { label, color, icon: ActionIcon }]) => (
                          <button key={act} title={label} onClick={() => openAction(u.id, act, u.email)}
                            className={`p-1.5 rounded-lg transition-all ${color}`}>
                            <ActionIcon size={13} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action confirmation modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-1">
                {actionLabels[actionModal.action]?.label ?? actionModal.action}
              </h3>
              <p className="text-slate-400 text-sm mb-4">{actionModal.email}</p>
              <label className="block text-sm font-medium text-slate-300 mb-1">Raison (optionnel)</label>
              <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={3}
                placeholder="Expliquez la raison de cette action..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none mb-4" />
              {actionMsg && (
                <p className={`text-sm mb-3 ${actionMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{actionMsg}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all">
                  Annuler
                </button>
                <button onClick={confirmAction} disabled={actionLoading}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    actionModal.action === 'delete' ? 'bg-red-500 hover:bg-red-600 text-white' :
                    actionModal.action === 'block' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                    'bg-brand-500 hover:bg-brand-400 text-white'
                  }`}>
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

// ==================== ADMINS TAB ====================
function AdminsTab() {
  const { session } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.access_token) return;
    const data = await adminFetch<any>('/api/admin/roles', session.access_token);
    if (data) {
      setRoles(data.roles ?? []);
      setAssignments(data.assignments ?? []);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  const addAdmin = async () => {
    if (!addEmail.trim() || !selectedRole || !session?.access_token) return;
    setAddLoading(true);
    setAddMsg('');
    const { ok, data } = await adminPost('/api/admin/assign-role', session.access_token, {
      user_email: addEmail.trim().toLowerCase(),
      role_id: selectedRole,
      notes: addNotes,
    });
    setAddLoading(false);
    if (ok) {
      setAddMsg('✓ Admin ajouté avec succès');
      setAddEmail(''); setSelectedRole(''); setAddNotes('');
      loadData();
    } else {
      setAddMsg(`✗ ${data?.error ?? 'Erreur inconnue'}`);
    }
  };

  const removeAdmin = async (userId: string) => {
    if (!session?.access_token || !confirm('Révoquer les droits admin de cet utilisateur ?')) return;
    setRemovingId(userId);
    await fetch('/api/admin/assign-role', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    setRemovingId(null);
    loadData();
  };

  const roleTypeColors: Record<string, string> = {
    super_admin: 'bg-red-500/20 text-red-400',
    full_access: 'bg-orange-500/20 text-orange-400',
    partial_access: 'bg-blue-500/20 text-blue-400',
    read_only: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserCog size={20} className="text-purple-400" />
          Ajouter un Administrateur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email de l&apos;utilisateur *</label>
            <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="user@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Rôle *</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all">
              <option value="">-- Sélectionner un rôle --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes (optionnel)</label>
            <input type="text" value={addNotes} onChange={e => setAddNotes(e.target.value)} placeholder="Ex: responsable vidéos"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all" />
          </div>
        </div>
        {addMsg && <p className={`text-sm mb-3 ${addMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{addMsg}</p>}
        <button onClick={addAdmin} disabled={addLoading || !addEmail.trim() || !selectedRole}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50">
          {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Assigner Admin
        </button>
      </Card>

      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Award size={18} className="text-purple-400" />
            Administrateurs Actuels ({assignments.length})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-brand-400" /></div>
        ) : assignments.length === 0 ? (
          <p className="text-slate-400 text-center py-10">Aucun admin assigné</p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {assignments.map((a: any) => {
              const assignedRole = roles.find(r => r.id === a.role_id);
              return (
                <div key={a.user_id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(a.users?.full_name || a.users?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{a.users?.full_name || a.users?.username || 'Sans nom'}</p>
                      <p className="text-slate-400 text-xs">{a.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {assignedRole && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleTypeColors[assignedRole.type] ?? 'bg-slate-700 text-slate-300'}`}>
                        {assignedRole.name}
                      </span>
                    )}
                    {a.notes && <span className="text-slate-500 text-xs italic">{a.notes}</span>}
                    <button onClick={() => removeAdmin(a.user_id)} disabled={removingId === a.user_id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 text-red-400">
                      {removingId === a.user_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Lock size={18} className="text-slate-400" />Rôles Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map(role => {
            const perms = role.permissions ?? {};
            return (
              <div key={role.id} className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleTypeColors[role.type] ?? 'bg-slate-700 text-slate-300'}`}>{role.type}</span>
                  <p className="text-white font-semibold text-sm">{role.name}</p>
                </div>
                {role.description && <p className="text-slate-400 text-xs mb-2">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(perms).map(([perm, allowed]) => (
                    <span key={perm} className={`px-1.5 py-0.5 rounded text-xs ${allowed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500 line-through'}`}>
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ==================== FINANCES TAB ====================
function FinancesTab() {
  const { session } = useAuth();
  const [finances, setFinances] = useState<any>(null);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [walletTxs, setWalletTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const TX_LIMIT = 20;

  const loadData = useCallback(async () => {
    if (!session?.access_token) return;
    const token = session.access_token;
    const [fin, wlt] = await Promise.all([
      adminFetch<any>('/api/admin/finances', token),
      adminFetch<any>(`/api/admin/hot-wallet?page=${txPage}&limit=${TX_LIMIT}`, token),
    ]);
    if (fin) setFinances(fin);
    if (wlt) {
      setWalletSummary(wlt.summary);
      setWalletTxs(wlt.transactions ?? []);
      setTxTotal(wlt.total ?? 0);
    }
    setLoading(false);
  }, [session, txPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const byPlanEntries = finances?.byPlan ? Object.entries(finances.byPlan) as [string, any][] : [];
  const planChartData = byPlanEntries.map(([plan, data]) => ({ name: plan, abonnés: data.count, revenus: data.revenue }));

  const txStatusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  };

  const txTypeColors: Record<string, string> = {
    deposit: 'text-green-400',
    withdrawal: 'text-red-400',
    transfer: 'text-blue-400',
    reward: 'text-gold-400',
    fee: 'text-slate-400',
  };

  return (
    <div className="space-y-6">
      {/* Gas Fee Manager — admin can change gas fee in real time */}
      {session?.access_token && (
        <GasFeeManager token={session.access_token} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenus Actifs (USD)', value: loading ? '…' : `$${parseFloat(finances?.totalActiveRevenue ?? '0').toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-400' },
          { label: 'Abonnés Actifs', value: loading ? '…' : (finances?.totalActiveSubscribers ?? 0), icon: Crown, color: 'from-gold-500 to-gold-400' },
          { label: 'Balance Plateforme', value: loading ? '…' : `${parseFloat(finances?.totalPlatformBalance ?? '0').toFixed(2)} SIDRA`, icon: Wallet, color: 'from-brand-500 to-brand-400' },
          { label: 'Tx en attente', value: loading ? '…' : (walletSummary?.pendingTransactions ?? 0), icon: Clock, color: 'from-orange-500 to-orange-400' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="p-5 bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
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

      {walletSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-1"><ArrowDownRight size={20} className="text-green-400" /><p className="text-slate-400 text-sm">Total Déposé</p></div>
            <p className="text-xl font-bold text-green-400">{parseFloat(walletSummary.totalDeposited).toFixed(4)} SIDRA</p>
          </Card>
          <Card className="p-4 bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-1"><ArrowUpRight size={20} className="text-red-400" /><p className="text-slate-400 text-sm">Total Retiré</p></div>
            <p className="text-xl font-bold text-red-400">{parseFloat(walletSummary.totalWithdrawn).toFixed(4)} SIDRA</p>
          </Card>
          <Card className="p-4 bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-1"><TrendingUp size={20} className="text-brand-400" /><p className="text-slate-400 text-sm">Flux Net</p></div>
            <p className={`text-xl font-bold ${parseFloat(walletSummary.netFlow) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(walletSummary.netFlow).toFixed(4)} SIDRA
            </p>
          </Card>
        </div>
      )}

      {planChartData.length > 0 && (
        <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-gold-400" />Abonnements par Plan
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={planChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="abonnés" fill="#0F7A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Wallet size={18} className="text-brand-400" />
            Toutes les Transactions ({txTotal.toLocaleString()})
          </h3>
          <button onClick={loadData} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-brand-400" /></div>
        ) : walletTxs.length === 0 ? (
          <p className="text-slate-400 text-center py-10">Aucune transaction trouvée</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/30 border-b border-slate-700/50">
                  <tr>
                    {['Utilisateur', 'Type', 'Montant', 'Frais', 'Statut', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-300 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {walletTxs.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{tx.users?.full_name || tx.users?.username || 'Inconnu'}</p>
                        <p className="text-slate-500 text-xs">{tx.users?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${txTypeColors[tx.type] ?? 'text-slate-400'}`}>
                          {tx.direction === 'in' ? '↓' : '↑'} {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-xs font-mono">{parseFloat(tx.amount).toFixed(4)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{tx.fee ? parseFloat(tx.fee).toFixed(4) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${txStatusColors[tx.status] ?? 'bg-slate-700 text-slate-400'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-slate-400 text-xs">Page {txPage} / {Math.max(1, Math.ceil(txTotal / TX_LIMIT))} — {txTotal} transactions</p>
              <div className="flex gap-2">
                <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                <button disabled={txPage >= Math.ceil(txTotal / TX_LIMIT)} onClick={() => setTxPage(p => p + 1)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ==================== SECURITY TAB ====================
function SecurityTab() {
  const { session } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterResolved, setFilterResolved] = useState('false');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({ type: 'manual_alert', severity: 'medium', title: '', description: '' });
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const LIMIT = 20;

  const loadEvents = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      ...(filterSeverity ? { severity: filterSeverity } : {}),
      ...(filterResolved !== '' ? { resolved: filterResolved } : {}),
    });
    const data = await adminFetch<any>(`/api/admin/security?${params}`, session.access_token);
    if (data) {
      setEvents(data.events ?? []);
      setSummary(data.summary);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [session, page, filterSeverity, filterResolved]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const resolveEvent = async (id: string) => {
    if (!session?.access_token) return;
    setResolvingId(id);
    await adminPost('/api/admin/security', session.access_token, { action: 'resolve', event_id: id });
    setResolvingId(null);
    loadEvents();
  };

  const sendAlert = async () => {
    if (!alertForm.title || !session?.access_token) return;
    setAlertLoading(true);
    const { ok, data } = await adminPost('/api/admin/security', session.access_token, { action: 'alert', ...alertForm });
    setAlertLoading(false);
    if (ok) {
      setAlertMsg('✓ Alerte créée');
      setAlertForm({ type: 'manual_alert', severity: 'medium', title: '', description: '' });
      loadEvents();
      setTimeout(() => { setAlertModal(false); setAlertMsg(''); }, 1500);
    } else {
      setAlertMsg(`✗ ${data?.error ?? 'Erreur'}`);
    }
  };

  const severityStyles: Record<string, { badge: string; dot: string; label: string }> = {
    critical: { badge: 'bg-red-500/20 text-red-400 border border-red-500/30', dot: 'bg-red-500 animate-pulse', label: 'Critique' },
    high: { badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', dot: 'bg-orange-500', label: 'Élevé' },
    medium: { badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-500', label: 'Moyen' },
    low: { badge: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', dot: 'bg-slate-500', label: 'Faible' },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Non résolus', value: summary?.totalUnresolved, icon: ShieldAlert, color: 'from-red-500 to-red-400' },
          { label: 'Critiques', value: summary?.critical, icon: AlertCircle, color: 'from-red-600 to-red-500' },
          { label: 'Élevés', value: summary?.high, icon: AlertTriangle, color: 'from-orange-500 to-orange-400' },
          { label: 'Moyens', value: summary?.medium, icon: Bell, color: 'from-yellow-500 to-yellow-400' },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="p-4 bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{loading ? '…' : (s.value ?? 0)}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
            <option value="">Toutes sévérités</option>
            {Object.entries(severityStyles).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <select value={filterResolved} onChange={e => { setFilterResolved(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50">
            <option value="false">Non résolus</option>
            <option value="true">Résolus</option>
            <option value="">Tous</option>
          </select>
          <button onClick={loadEvents} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
        <button onClick={() => setAlertModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-all">
          <Send size={14} />Créer une Alerte
        </button>
      </div>

      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-red-400" />Événements de Sécurité ({total})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-red-400" /></div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <CheckCircle size={40} className="text-green-400" />
            <p className="text-slate-400 font-medium">Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {events.map((ev: any) => {
              const sev = severityStyles[ev.severity] ?? severityStyles.low;
              return (
                <div key={ev.id} className={`px-6 py-5 hover:bg-slate-700/10 transition-all ${ev.resolved ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${sev.badge}`}>{sev.label}</span>
                          <span className="text-slate-500 text-xs font-mono">{ev.type}</span>
                          {ev.resolved && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Résolu</span>}
                        </div>
                        <p className="text-white font-semibold text-sm">{ev.title}</p>
                        {ev.description && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{ev.description}</p>}
                        {ev.users && <p className="text-slate-500 text-xs mt-1">👤 {ev.users.email || ev.users.full_name}</p>}
                        <p className="text-slate-600 text-xs mt-1 flex items-center gap-1">
                          <Clock size={10} />{new Date(ev.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {!ev.resolved && (
                      <button onClick={() => resolveEvent(ev.id)} disabled={resolvingId === ev.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium transition-all flex-shrink-0 disabled:opacity-50">
                        {resolvingId === ev.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Résoudre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {total > LIMIT && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-slate-400 text-xs">Page {page} / {Math.ceil(total / LIMIT)}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {alertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-400" />Créer une Alerte Manuelle
              </h3>
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Type</label>
                    <select value={alertForm.type} onChange={e => setAlertForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                      <option value="manual_alert">Alerte manuelle</option>
                      <option value="brute_force">Force brute</option>
                      <option value="suspicious_transaction">Transaction suspecte</option>
                      <option value="data_breach">Fuite de données</option>
                      <option value="intrusion_attempt">Intrusion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sévérité</label>
                    <select value={alertForm.severity} onChange={e => setAlertForm(f => ({ ...f, severity: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Élevé</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Titre *</label>
                  <input value={alertForm.title} onChange={e => setAlertForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Activité suspecte détectée"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description</label>
                  <textarea value={alertForm.description} onChange={e => setAlertForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Décrivez l'incident..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none resize-none" />
                </div>
              </div>
              {alertMsg && <p className={`text-sm mb-3 ${alertMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{alertMsg}</p>}
              <div className="flex gap-3">
                <button onClick={() => setAlertModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium">Annuler</button>
                <button onClick={sendAlert} disabled={alertLoading || !alertForm.title}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {alertLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
