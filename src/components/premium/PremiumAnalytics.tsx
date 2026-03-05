'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface AnalyticsProps {
  sptcEarned: number;
  totalEarned: number;
  referrals: number;
}

export function PremiumAnalytics({ sptcEarned, totalEarned, referrals }: AnalyticsProps) {
  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', earned: 120 },
    { month: 'Feb', earned: 150 },
    { month: 'Mar', earned: 200 },
    { month: 'Apr', earned: 180 },
    { month: 'May', earned: 250 },
    { month: 'Jun', earned: 300 },
  ];

  const sourceData = [
    { source: 'Surveys', percentage: 45 },
    { source: 'Referrals', percentage: 35 },
    { source: 'Monthly Bonus', percentage: 20 },
  ];

  const maxValue = Math.max(...monthlyData.map((d) => d.earned));

  return (
    <section className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium">Current Balance</h3>
            <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{sptcEarned}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">SPTC Tokens</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium">Total Earned</h3>
            <TrendingUp size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{totalEarned}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">All Time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium">Referrals</h3>
            <Users size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{referrals}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Active Friends</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-950 dark:text-white">Earnings Trend</h3>
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
          </div>

          <div className="space-y-4">
            {monthlyData.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.month}</span>
                  <span className="text-sm font-semibold text-gray-950 dark:text-white">{item.earned} SPTC</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full overflow-hidden"
                  style={{
                    width: `${(item.earned / maxValue) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 space-y-6"
        >
          <h3 className="text-xl font-bold text-gray-950 dark:text-white">Earnings Source</h3>

          <div className="space-y-4">
            {sourceData.map((item, idx) => {
              const colors = [
                'from-blue-500 to-blue-400',
                'from-orange-500 to-orange-400',
                'from-purple-500 to-purple-400',
              ];
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.source}</span>
                    <span className="text-sm font-semibold text-gray-950 dark:text-white">{item.percentage}%</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className={`h-3 bg-gradient-to-r ${colors[idx]} rounded-full`}
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
