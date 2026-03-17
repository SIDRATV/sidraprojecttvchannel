'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Upload,
  Grid3x3,
  TrendingUp,
  Globe,
  LogOut,
  Menu,
  X,
  Video,
  PlayCircle,
  Radio,
  Settings,
  Eye,
  User,
  Calendar,
  Download,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Clock,
  Activity,
  Award,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

type Tab = 'overview' | 'users' | 'content' | 'categories' | 'analytics';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Grid3x3 },
    { id: 'content', label: 'Contenu', icon: Video },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'categories', label: 'Catégories', icon: BarChart3 },
    { id: 'analytics', label: 'Analytiques', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar Navigation - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:bg-slate-900/60 lg:border-r lg:border-slate-800 lg:backdrop-blur-xl lg:z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 border-b border-slate-800/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                <Video size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Sidra Admin</h1>
                <p className="text-xs text-slate-400 font-medium">Chaîne TV</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setActiveTab(id as Tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Settings & Logout */}
          <div className="p-4 space-y-2 border-t border-slate-800/50">
            <motion.button
              whileHover={{ scale: 1.01 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-all font-medium text-sm"
            >
              <Settings size={18} />
              Paramètres
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
            >
              <LogOut size={18} />
              Déconnexion
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
            <Video size={18} />
          </div>
          <span className="font-bold text-white text-sm">Sidra Admin</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 p-4 space-y-2"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => {
                setActiveTab(id as Tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Tableau de Bord
              </h1>
              <p className="text-slate-400">Gérez votre plateforme de streaming</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm w-fit"
            >
              <Download size={16} />
              Exporter
            </motion.button>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
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
  const stats = [
    {
      label: 'Vidéos Totales',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Video,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Vues Totales',
      value: '525.2K',
      change: '+28.3%',
      trend: 'up',
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Utilisateurs Actifs',
      value: '12,432',
      change: '+8.1%',
      trend: 'up',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Revenus',
      value: '$24.5K',
      change: '+15.2%',
      trend: 'up',
      icon: Award,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const viewsData = [
    { date: 'Lun', videos: 2400, podcasts: 1200, lives: 800 },
    { date: 'Mar', videos: 3210, podcasts: 1390, lives: 920 },
    { date: 'Mer', videos: 2290, podcasts: 9800, lives: 1229 },
    { date: 'Jeu', videos: 2000, podcasts: 9800, lives: 2000 },
    { date: 'Ven', videos: 2181, podcasts: 7490, lives: 2100 },
    { date: 'Sam', videos: 2500, podcasts: 3490, lives: 2100 },
    { date: 'Dim', videos: 2100, podcasts: 4300, lives: 2200 },
  ];

  const usersData = [
    { name: 'États-Unis', value: 4000, percentage: 35 },
    { name: 'Europe', value: 3000, percentage: 26 },
    { name: 'Asie', value: 2500, percentage: 22 },
    { name: 'Afrique', value: 1200, percentage: 10 },
    { name: 'Autres', value: 500, percentage: 7 },
  ];

  const recentActivity = [
    {
      action: 'Nouvelle vidéo publiée',
      user: 'Chaîne Tech',
      time: 'Il y a 2h',
      icon: Video,
      color: 'text-blue-500',
    },
    {
      action: 'Utilisateur enregistré',
      user: 'Jean Dupont',
      time: 'Il y a 4h',
      icon: User,
      color: 'text-green-500',
    },
    {
      action: 'Stream en direct commencé',
      user: 'Conférence Tech',
      time: 'Il y a 1h',
      icon: Radio,
      color: 'text-purple-500',
    },
    {
      action: 'Podcast téléchargé',
      user: 'Talks Startup',
      time: 'Il y a 5h',
      icon: PlayCircle,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <Card className="relative p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/30 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 from-blue-500 to-cyan-500 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} opacity-20 group-hover:opacity-30 transition-opacity`}
                    >
                      <Icon size={20} className={`text-white`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="text-green-400" />
                      <span className="text-xs font-bold text-green-400">{stat.change}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Vues par Type de Contenu
              </h3>
              <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                <Filter size={16} className="text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="videos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="podcasts" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="lives" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-slate-800/30 border border-slate-700/50 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Globe size={20} className="text-cyan-500" />
              Distribution Géo
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={usersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {usersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {usersData.slice(0, 3).map((region, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <span className="text-slate-300">{region.name}</span>
                  </div>
                  <span className="font-semibold text-blue-400">{region.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-green-500" />
            Activité Récente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-700/20 hover:bg-slate-700/40 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-slate-600/50 transition-all">
                      <Icon size={18} className={activity.color} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{activity.action}</p>
                      <p className="text-slate-400 text-xs">{activity.user}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {activity.time}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ==================== CONTENT TAB ====================
function ContentTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const contentData = [
    {
      id: 1,
      title: 'Introduction au React Moderne',
      type: 'Vidéo',
      icon: Video,
      status: 'Publié',
      views: 2540,
      date: '2024-03-12',
      duration: '24:35',
      thumbnail: '🎬',
    },
    {
      id: 2,
      title: 'Conférence Tech 2024',
      type: 'Stream en Direc',
      icon: Radio,
      status: 'En cours',
      views: 1235,
      date: '2024-03-13',
      duration: 'EN DIRECT',
      thumbnail: '📡',
    },
    {
      id: 3,
      title: 'Podcast: Avenir IA',
      type: 'Podcast',
      icon: PlayCircle,
      status: 'Publié',
      views: 856,
      date: '2024-03-10',
      duration: '52:14',
      thumbnail: '🎙️',
    },
    {
      id: 4,
      title: 'Tutoriel Next.js 14',
      type: 'Vidéo',
      icon: Video,
      status: 'Brouillon',
      views: 0,
      date: '2024-03-15',
      duration: '18:45',
      thumbnail: '🎬',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher du contenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm w-full md:w-fit"
        >
          <Plus size={18} />
          Ajouter Contenu
        </motion.button>
      </div>

      {/* Content Table */}
      <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Titre</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Statut</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Vues</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Durée</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-300">Date</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {contentData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-2xl">{item.thumbnail}</div>
                      <p className="text-white font-medium">{item.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-700/50 text-slate-200 rounded-full text-xs font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Publié'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'En cours'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Eye size={14} />
                      {item.views.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{item.duration}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                        <Edit size={14} className="text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==================== USERS TAB ====================
function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const usersData = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      role: 'Premium',
      status: 'Actif',
      joinDate: '2024-01-15',
      views: 1234,
      avatar: '',
    },
    {
      id: 2,
      name: 'Fatima Zahra',
      email: 'fatima@example.com',
      role: 'Gratuit',
      status: 'Actif',
      joinDate: '2024-02-20',
      views: 856,
      avatar: '',
    },
    {
      id: 3,
      name: 'Mohamed Ali',
      email: 'ali@example.com',
      role: 'Premium',
      status: 'Inactif',
      joinDate: '2024-01-10',
      views: 0,
      avatar: '',
    },
    {
      id: 4,
      name: 'Aisha Malik',
      email: 'aisha@example.com',
      role: 'Premium Plus',
      status: 'Actif',
      joinDate: '2024-02-01',
      views: 2156,
      avatar: '',
    },
  ];

  const statsUser = [
    { label: 'Utilisateurs Totaux', value: '12,432', icon: Users, color: 'text-blue-500' },
    { label: 'Actifs Aujourd\'hui', value: '3,456', icon: Activity, color: 'text-green-500' },
    { label: 'Premium', value: '8,234', icon: Award, color: 'text-purple-500' },
    { label: 'Nouveaux (30j)', value: '456', icon: Plus, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsUser.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <Icon size={24} className={stat.color} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher des utilisateurs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <Card className="overflow-hidden border border-slate-700/50 bg-slate-800/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Utilisateur</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Rôle</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Statut</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Vues</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Inscription</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {usersData.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <p className="text-white font-medium">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.status === 'Actif'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{user.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{user.joinDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                          <Edit size={14} className="text-blue-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab() {
  const categoriesData = [
    {
      id: 1,
      name: 'Éducation',
      videos: 234,
      views: 45000,
      status: 'Actif',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 2,
      name: 'Technologie',
      videos: 189,
      views: 78000,
      status: 'Actif',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 3,
      name: 'Divertissement',
      videos: 456,
      views: 125000,
      status: 'Actif',
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 4,
      name: 'Sport',
      videos: 123,
      views: 34000,
      status: 'Actif',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
        >
          <Plus size={18} />
          Ajouter Catégorie
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoriesData.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/30 transition-all overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white">{category.name}</h3>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                    <ChevronDown size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs font-medium mb-1">Vidéos</p>
                    <p className="text-2xl font-bold text-white">{category.videos}</p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs font-medium mb-1">Vues</p>
                    <p className="text-2xl font-bold text-white">{(category.views / 1000).toFixed(0)}K</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs transition-all">
                    Éditer
                  </button>
                  <button className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium text-xs transition-all">
                    Supprimer
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== ANALYTICS TAB ====================
function AnalyticsTab() {
  const monthlyData = [
    { month: 'Jan', videos: 2400, podcasts: 1200, lives: 800 },
    { month: 'Fév', videos: 3210, podcasts: 1390, lives: 920 },
    { month: 'Mar', videos: 2290, podcasts: 9800, lives: 1229 },
    { month: 'Avr', videos: 2000, podcasts: 9800, lives: 2000 },
    { month: 'Mai', videos: 2181, podcasts: 7490, lives: 2100 },
    { month: 'Juin', videos: 2500, podcasts: 3490, lives: 2100 },
  ];

  const viewsOverTime = [
    { date: 'Lun', value: 4000 },
    { date: 'Mar', value: 3000 },
    { date: 'Mer', value: 2000 },
    { date: 'Jeu', value: 2780 },
    { date: 'Ven', value: 1890 },
    { date: 'Sam', value: 2390 },
    { date: 'Dim', value: 3490 },
  ];

  const engagementData = [
    { name: 'Likes', value: 65 },
    { name: 'Commentaires', value: 45 },
    { name: 'Partages', value: 30 },
    { name: 'Downloads', value: 25 },
  ];

  return (
    <div className="space-y-8">
      {/* Line Chart - Views Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Vues sur 7 jours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Bar Chart - Monthly Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-500" />
            Contenu par Mois
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="videos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="podcasts" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lives" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-slate-800/30 border border-slate-700/50 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              Métriques d'Engagement
            </h3>
            <div className="space-y-4">
              {engagementData.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <span className="text-blue-400 font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.8 }}
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Performing Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-6">Contenu Populaire</h3>
            <div className="space-y-3">
              {[
                { title: 'Tutoriel React 18', views: 12500 },
                { title: 'Conférence IA 2024', views: 9800 },
                { title: 'Podcast Tech Talks', views: 8650 },
                { title: 'Live Coding Session', views: 7234 },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Eye size={14} />
                      <span className="text-xs font-semibold">{item.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
