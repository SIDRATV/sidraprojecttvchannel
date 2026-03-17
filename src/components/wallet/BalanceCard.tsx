'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface BalanceCardProps {
  title: string;
  balance: string | null;
  symbol: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
  onRefresh?: () => void;
  isRefreshing?: boolean;
  subtitle?: string;
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-600/20 via-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300',
    icon: 'text-blue-400',
    accent: 'text-blue-500',
  },
  emerald: {
    gradient: 'from-emerald-600/20 via-emerald-500/10 to-green-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
    icon: 'text-emerald-400',
    accent: 'text-emerald-500',
  },
  purple: {
    gradient: 'from-purple-600/20 via-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300',
    icon: 'text-purple-400',
    accent: 'text-purple-500',
  },
  amber: {
    gradient: 'from-amber-600/20 via-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300',
    icon: 'text-amber-400',
    accent: 'text-amber-500',
  },
};

export function BalanceCard({
  title,
  balance,
  symbol,
  icon,
  color,
  onRefresh,
  isRefreshing,
  subtitle,
}: BalanceCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative bg-gradient-to-br ${config.gradient} backdrop-blur-xl border ${config.border} rounded-2xl p-6 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} blur-xl`} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6 }}
            className={`p-3 rounded-xl ${config.badge}`}
          >
            {icon}
          </motion.div>
        </div>

        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="text-4xl md:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="flex-1">
              {balance ? parseFloat(balance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }) : (
                <span className="text-3xl text-slate-400">-</span>
              )}
            </div>
            <span className="text-2xl font-bold text-white">{symbol}</span>
          </div>
        </motion.div>

        {/* Action Button */}
        {onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 text-sm font-medium ${config.accent} hover:${config.accent}/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRefreshing ? {
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              } : {}}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Balance'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
