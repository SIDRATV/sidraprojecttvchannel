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
} from 'lucide-react';
import { Card } from '@/components/ui';

type Tab = 'overview' | 'users' | 'upload' | 'categories' | 'analytics';

const COLORS = ['bg-blue-600', 'bg-blue-500', 'bg-blue-700', 'bg-cyan-600', 'bg-blue-400'];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for charts
  const viewsData = [
    { date: 'Jan 1', views: 2400, podcasts: 1200, lives: 1200 },
    { date: 'Jan 8', views: 3210, podcasts: 1390, lives: 1820 },
    { date: 'Jan 15', views: 2290, podcasts: 9800, lives: 2290 },
    { date: 'Jan 22', views: 2000, podcasts: 9800, lives: 2000 },
    { date: 'Jan 29', views: 2181, podcasts: 7490, lives: 2100 },
    { date: 'Feb 5', views: 2500, podcasts: 3490, lives: 2100 },
    { date: 'Feb 12', views: 2100, podcasts: 4300, lives: 2200 },
  ];

  const usersData = [
    { name: 'USA', value: 4000, percentage: 35 },
    { name: 'Europe', value: 3000, percentage: 26 },
    { name: 'Asia', value: 2500, percentage: 22 },
    { name: 'Africa', value: 1200, percentage: 10 },
    { name: 'Others', value: 500, percentage: 7 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Grid3x3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Sidebar Navigation - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-gray-900/50 lg:border-r lg:border-gray-800 lg:backdrop-blur lg:z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                S
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Sidra Admin</h1>
                <p className="text-xs text-gray-400">TV Channel</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all font-medium"
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            S
          </div>
          <span className="font-bold text-white">Admin</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 p-4 space-y-2 max-h-96 overflow-y-auto"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab(id as Tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your platform, users, and content</p>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {activeTab === 'overview' && <OverviewTab viewsData={viewsData} usersData={usersData} />}
            {activeTab === 'users' && (
              <Card className="p-8 bg-gray-800/50 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
                <p className="text-gray-400">User management interface coming soon...</p>
              </Card>
            )}
            {activeTab === 'upload' && (
              <Card className="p-8 bg-gray-800/50 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Upload Video/Podcast/Live</h2>
                <p className="text-gray-400">Upload functionality coming soon...</p>
              </Card>
            )}
            {activeTab === 'categories' && (
              <Card className="p-8 bg-gray-800/50 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Manage Categories</h2>
                <p className="text-gray-400">Category management coming soon...</p>
              </Card>
            )}
            {activeTab === 'analytics' && <AnalyticsTab viewsData={viewsData} usersData={usersData} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface OverviewTabProps {
  viewsData: any[];
  usersData: any[];
}

function OverviewTab({ viewsData, usersData }: OverviewTabProps) {
  const stats = [
    { label: 'Total Videos', value: '1,234', change: '+12%', icon: '🎬' },
    { label: 'Total Views', value: '525.2K', change: '+28%', icon: '👁️' },
    { label: 'Total Users', value: '12,432', change: '+8%', icon: '👥' },
    { label: 'Revenue', value: '$24.5K', change: '+15%', icon: '💰' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm font-semibold text-green-400">{stat.change}</span>
              </div>
              <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
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
          <Card className="p-6 bg-gray-800/50 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6">Views Over Time</h3>
            <div className="h-80 flex items-end gap-2">
              {viewsData.map((data, idx) => {
                const maxViews = Math.max(...viewsData.map(d => d.views));
                const height = (data.views / maxViews) * 100;
                return (
                  <div key={idx} className="flex-1 group">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t relative hover:shadow-xl transition-all"
                      style={{ height: `${height}%` }}
                      title={`${data.date}: ${data.views} views`}
                    >
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 mb-2">
                        {data.views.toLocaleString()}
                      </div>
                    </motion.div>
                    <p className="text-xs text-gray-400 text-center mt-2">{data.date}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Users by Country - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gray-800/50 border border-gray-700 h-full">
            <h3 className="text-lg font-bold text-white mb-6">Users by Country</h3>
            <div className="space-y-4">
              {usersData.map((region, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{region.name}</span>
                    <span className="font-semibold text-blue-400">{region.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${region.percentage}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.8 }}
                      className={`h-2.5 rounded-full ${COLORS[idx % COLORS.length].replace('text-', 'bg-') || 'bg-blue-500'}`}
                    />
                  </div>
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
        <Card className="p-6 bg-gray-800/50 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New user registration', user: 'John Doe', time: '2 hours ago', icon: '👤' },
              { action: 'Video uploaded', user: 'Tech Channel', time: '3 hours ago', icon: '🎬' },
              { action: 'New podcast episode', user: 'Startup Talks', time: '5 hours ago', icon: '🎙️' },
              { action: 'Live stream started', user: 'Tech Conference', time: '1 hour ago', icon: '📡' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{activity.action}</p>
                    <p className="text-gray-400 text-xs">{activity.user}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

interface AnalyticsTabProps {
  viewsData: any[];
  usersData: any[];
}

function AnalyticsTab({ viewsData, usersData }: AnalyticsTabProps) {
  return (
    <div className="space-y-8">
      {/* Detailed Views Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gray-800/50 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-6">Detailed Views Analytics</h3>
          <div className="h-96 flex items-end gap-2">
            {viewsData.map((data, idx) => {
              const maxTotal = Math.max(
                ...viewsData.map(d => d.views + d.podcasts + d.lives)
              );
              const totalHeight = ((data.views + data.podcasts + data.lives) / maxTotal) * 100;
              const viewsHeight = (data.views / (data.views + data.podcasts + data.lives)) * totalHeight;
              const podcastsHeight = (data.podcasts / (data.views + data.podcasts + data.lives)) * totalHeight;
              const livesHeight = (data.lives / (data.views + data.podcasts + data.lives)) * totalHeight;

              return (
                <div key={idx} className="flex-1 group">
                  <div className="h-full flex flex-col justify-end">
                    <motion.div
                      className="w-full rounded-t flex flex-col"
                      style={{ height: `${totalHeight}%` }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-full bg-blue-600"
                        style={{ height: `${viewsHeight}%` }}
                        title={`Views: ${data.views}`}
                      />
                      <div
                        className="w-full bg-blue-600"
                        style={{ height: `${podcastsHeight}%` }}
                        title={`Podcasts: ${data.podcasts}`}
                      />
                      <div
                        className="w-full bg-cyan-600 rounded-b"
                        style={{ height: `${livesHeight}%` }}
                        title={`Lives: ${data.lives}`}
                      />
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">{data.date}</p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-6 mt-6 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="text-sm text-gray-400">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="text-sm text-gray-400">Podcasts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-cyan-600" />
              <span className="text-sm text-gray-400">Lives</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Users Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gray-800/50 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6">Geographic Distribution</h3>
            <div className="space-y-4">
              {usersData.map((region, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">{region.name}</span>
                    <span className="font-semibold text-blue-400">{region.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${region.percentage}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.8 }}
                      className={`h-3 rounded-full ${COLORS[idx % COLORS.length]}`}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{region.value.toLocaleString()} users</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {usersData.map((region, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-blue-500" />
                  <span className="font-semibold text-white">{region.name}</span>
                </div>
                <span className="text-blue-400 font-bold">{region.percentage}%</span>
              </div>
              <p className="text-gray-400 text-sm">{region.value.toLocaleString()} active users</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
