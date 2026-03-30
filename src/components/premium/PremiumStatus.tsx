'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Star, ArrowUp } from 'lucide-react';
import { PREMIUM_PLANS } from '@/types/premium';
import { usePremium } from '@/hooks/usePremium';
import { useRouter } from 'next/navigation';

export function PremiumStatus() {
  const { status } = usePremium();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!status.isActive || !status.plan) {
    return null;
  }

  const currentPlan = PREMIUM_PLANS[status.plan];
  const planIndex = Object.keys(PREMIUM_PLANS).indexOf(status.plan);
  const availableUpgrades = Object.entries(PREMIUM_PLANS)
    .slice(planIndex + 1)
    .map(([key, plan]) => plan);

  const handleUpgrade = (newPlan: 'pro' | 'premium' | 'vip') => {
    setShowUpgradeModal(false);
    router.push(`/subscribe?upgrade=${newPlan}`);
  };

  const iconMap: Record<string, React.ComponentType<any>> = {
    Zap: Zap,
    Crown: Crown,
    Star: Star,
  };
  const Icon = iconMap[currentPlan.icon] || Zap;

  return (
    <section className="space-y-8">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-gradient-to-br ${currentPlan.color} border-2 border-opacity-50 rounded-2xl p-8 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Icon size={32} className="text-white" />
                <div>
                  <h2 className="text-3xl font-bold text-white">{currentPlan.name}</h2>
                  <p className="text-white/70">Active Since {new Date(status.activatedAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">${currentPlan.price}</p>
              <p className="text-white/70 text-sm">/month</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-white mb-4">Included Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-green-300 text-lg">✓</span>
                  <span className="text-white text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 flex-wrap">
            {availableUpgrades.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <ArrowUp size={18} />
                Upgrade Plan
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white">Upgrade Your Plan</h3>

                <div className="grid grid-cols-1 gap-4">
                  {availableUpgrades.map((plan) => (
                    <motion.button
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpgrade(plan.id)}
                      className="p-6 bg-gray-800 border-2 border-gray-700 hover:border-brand-500 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                          <p className="text-gray-400 text-sm">{plan.features.slice(0, 3).join(' • ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">${plan.price}</p>
                          <p className="text-xs text-gray-400">/month</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
