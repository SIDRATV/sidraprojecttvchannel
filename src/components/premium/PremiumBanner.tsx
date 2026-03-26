'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Star } from 'lucide-react';
import Link from 'next/link';

export function PremiumBanner() {
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const plan = localStorage.getItem('activePremiumPlan');
    setActivePlan(plan);
    setIsLoading(false);
  }, []);

  if (isLoading || !activePlan) return null;

  const planConfig = {
    pro: { name: 'Pro', icon: Zap, color: 'from-brand-500 to-brand-500', bgColor: 'bg-brand-500/10', borderColor: 'border-brand-500/30' },
    premium: { name: 'Premium', icon: Crown, color: 'from-yellow-600 to-orange-600', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    vip: { name: 'VIP', icon: Star, color: 'from-purple-600 to-pink-600', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  };

  const config = planConfig[activePlan as keyof typeof planConfig] || planConfig.pro;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-2 flex items-center justify-between`}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-lg bg-gradient-to-br ${config.color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Active Plan</p>
          <p className="font-bold text-sm text-white">{config.name} Unlocked ✨</p>
        </div>
      </div>
      <Link href="/premium">
        <button className="px-3 py-1 bg-gradient-to-r from-brand-500 to-brand-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all">
          View Details
        </button>
      </Link>
    </motion.div>
  );
}
