'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';

export function PremiumBanner() {
  // Use auth context — premium_plan is already loaded by AuthProvider (no extra API call needed)
  const { user } = useAuth();

  const activePlan = user?.premium_plan &&
    user.premium_plan !== 'free' &&
    (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date())
    ? user.premium_plan.toLowerCase()
    : null;

  if (!activePlan) return null;

  const planConfig = {
    pro: { name: 'Pro', icon: Zap, color: 'from-brand-500 to-brand-400', bgColor: 'bg-brand-500/10', borderColor: 'border-brand-500/30' },
    premium: { name: 'Premium', icon: Crown, color: 'from-gold-500 to-gold-400', bgColor: 'bg-gold-500/10', borderColor: 'border-gold-500/30' },
    vip: { name: 'VIP', icon: Star, color: 'from-purple-600 to-pink-600', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  };

  const config = planConfig[activePlan as keyof typeof planConfig] || planConfig.pro;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${config.bgColor} border ${config.borderColor} rounded-xl p-3 flex items-center justify-between backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.color} shadow-lg`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Plan</p>
          <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
            {config.name} Unlocked
            <Sparkles size={12} className="text-gold-400" />
          </p>
        </div>
      </div>
      <Link href="/premium">
        <button className="px-4 py-1.5 bg-gradient-to-r from-brand-500 to-brand-400 text-white text-xs font-bold rounded-lg hover:shadow-glow transition-all duration-300">
          View Details
        </button>
      </Link>
    </motion.div>
  );
}
