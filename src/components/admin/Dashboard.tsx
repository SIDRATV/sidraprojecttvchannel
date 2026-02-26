'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, BarChart3, Grid3x3, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VideoUploadForm } from './VideoUploadForm';
import { CategoryManager } from './CategoryManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';

type Tab = 'overview' | 'upload' | 'categories' | 'analytics';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Grid3x3 },
    { id: 'upload', label: 'Upload Video', icon: Upload },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your content, categories, and analytics</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'upload' && <VideoUploadForm />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </motion.div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    { label: 'Total Videos', value: '1,234', icon: '🎬' },
    { label: 'Total Views', value: '525.2K', icon: '👁️' },
    { label: 'Categories', value: '12', icon: '📂' },
    { label: 'Active Users', value: '8,432', icon: '👥' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6 text-center">
          <div className="text-4xl mb-3">{stat.icon}</div>
          <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
          <div className="text-2xl font-bold text-white">{stat.value}</div>
        </Card>
      ))}
    </div>
  );
}
