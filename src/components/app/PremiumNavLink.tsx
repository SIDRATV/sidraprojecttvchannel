'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';

export function PremiumNavLink() {
  const { status } = usePremium();
  const { user } = useAuth();
  const isActive = status.isActive || !!user?.premium_plan;

  // If premium is active, link to dashboard, otherwise to premium page
  const href = isActive ? '/premium-dashboard' : '/premium';
  const label = isActive ? 'Dashboard' : 'Premium';

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
        }`}
      >
        <Sparkles size={20} />
        <span className="font-medium">{label}</span>
        {isActive && (
          <motion.div
            className="ml-auto px-2 py-0.5 bg-yellow-500/30 text-yellow-400 text-xs rounded-full font-bold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
}
