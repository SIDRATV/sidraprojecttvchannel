'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

export function AnalyticsDashboard() {
  const analyticsData = [
    {
      title: 'Total Views',
      value: '525.2K',
      change: '+12.5%',
      icon: Eye,
      color: 'from-blue-600 to-blue-400',
    },
    {
      title: 'Watch Time',
      value: '2.4M hours',
      change: '+23.1%',
      icon: TrendingUp,
      color: 'from-green-600 to-green-400',
    },
    {
      title: 'Subscribers',
      value: '8,432',
      change: '+5.2%',
      icon: Users,
      color: 'from-blue-600 to-blue-400',
    },
    {
      title: 'Engagement',
      value: '4.8%',
      change: '+2.1%',
      icon: BarChart3,
      color: 'from-orange-600 to-orange-400',
    },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {analyticsData.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} opacity-20`}
                  >
                    <Icon size={24} className="text-white opacity-100" />
                  </div>
                  <span className="text-green-400 text-sm font-semibold">{stat.change}</span>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { activity: 'New video published', timestamp: '2 hours ago' },
            { activity: '1,234 new views', timestamp: '4 hours ago' },
            { activity: '45 new comments', timestamp: '1 day ago' },
            { activity: '128 new subscribers', timestamp: '1 day ago' },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
            >
              <span className="text-gray-300">{item.activity}</span>
              <span className="text-sm text-gray-500">{item.timestamp}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
