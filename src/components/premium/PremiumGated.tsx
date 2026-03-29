'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePremium } from '@/hooks/usePremium';

interface PremiumGatedProps {
  children: React.ReactNode;
  featureId?: string;
  featureName?: string;
}

export function PremiumGated({
  children,
  featureId,
  featureName = 'Premium Feature',
}: PremiumGatedProps) {
  const { status, hasFeature } = usePremium();

  // If premium is active and feature is available, show content
  if (
    status.isActive &&
    (!featureId || hasFeature(featureId))
  ) {
    return <>{children}</>;
  }

  // Otherwise show locked content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Background with blur */}
      <div className="blur-sm pointer-events-none">{children}</div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
        <div className="space-y-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-brand-500/30 border-2 border-brand-400 flex items-center justify-center mx-auto"
          >
            <Lock className="text-brand-400" size={32} />
          </motion.div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">{featureName}</h3>
            <p className="text-gray-300 text-sm max-w-xs mx-auto">
              Unlock this feature with a premium subscription
            </p>
          </div>

          <Link href={status.isActive ? '/premium-dashboard' : '/subscribe'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-brand-500 to-brand-500 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto hover:shadow-lg transition-all"
            >
              <Sparkles size={18} />
              {status.isActive ? 'Upgrade Plan' : 'Get Premium'}
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
