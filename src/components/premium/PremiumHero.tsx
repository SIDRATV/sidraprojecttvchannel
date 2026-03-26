'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';

interface PremiumHeroProps {
  onUnlockClick: () => void;
  onLearnMore: () => void;
}

export default function PremiumHero({ onUnlockClick, onLearnMore }: PremiumHeroProps) {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-900 via-brand-800/50 to-gray-900 py-20 lg:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Premium Badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/20 border border-brand-500/50 rounded-full">
              <Crown size={20} className="text-yellow-400" />
              <span className="text-sm font-bold text-brand-300">Premium Access</span>
              <Zap size={20} className="text-yellow-400" />
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight"
          >
            Unlock the Full{' '}
            <span className="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
              Sidra Experience
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Access exclusive documentaries, founder interviews, masterclasses, and early insights into the world of innovation. Join thousands of members discovering the future today.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUnlockClick}
              className="px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
            >
              🔓 Unlock Premium
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLearnMore}
              className="px-8 py-4 bg-gray-800/50 border border-brand-500/50 text-white font-bold rounded-lg hover:bg-gray-700/50 transition-all text-lg"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-8 justify-center items-center text-gray-400 text-sm pt-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400">✓</span>
              </div>
              <span>7-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400">✓</span>
              </div>
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400">✓</span>
              </div>
              <span>Secure SPTC Payment</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
