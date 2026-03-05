'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethod: (method: 'sptc' | 'card') => void;
  isPremiumUser?: boolean;
}

export default function PremiumModal({
  isOpen,
  onClose,
  onPaymentMethod,
  isPremiumUser = false,
}: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | 'vip'>('premium');

  const plans = {
    pro: { name: 'Pro', sptc: 100, price: 9.99 },
    premium: { name: 'Premium', sptc: 200, price: 19.99 },
    vip: { name: 'VIP', sptc: 300, price: 29.99 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/50 rounded-2xl overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors z-10"
              >
                <X size={20} className="text-white" />
              </button>

              {isPremiumUser ? (
                // Already Premium
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center space-y-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-4xl">👑</span>
                    </div>
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">You&apos;re Premium!</h2>
                    <p className="text-gray-400">
                      You already have premium access. Enjoy all exclusive features.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg"
                  >
                    Close
                  </motion.button>
                </motion.div>
              ) : (
                // Select Plan & Payment
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
                    <p className="text-gray-400">Select a plan and unlock premium content</p>
                  </div>

                  {/* Plan Selection */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['pro', 'premium', 'vip'] as const).map((planKey) => (
                      <motion.button
                        key={planKey}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPlan(planKey)}
                        className={`p-4 rounded-lg transition-all ${
                          selectedPlan === planKey
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 border border-blue-400'
                            : 'bg-gray-700/50 border border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        <p className="font-bold text-white">{plans[planKey].name}</p>
                        <p className="text-sm text-gray-200 mt-1">{plans[planKey].sptc} SPTC</p>
                        <p className="text-xs text-gray-300 mt-1">${plans[planKey].price}/mo</p>
                      </motion.button>
                    ))}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-300">Choose payment method:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* SPTC Payment */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPaymentMethod('sptc')}
                        className="p-4 bg-gradient-to-br from-orange-600/30 to-yellow-600/30 border border-orange-500/50 hover:border-orange-500 rounded-lg transition-all text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Wallet className="text-orange-400" size={20} />
                          <span className="font-bold text-white">Pay with SPTC</span>
                        </div>
                        <p className="text-xs text-gray-300">
                          {plans[selectedPlan].sptc} SPTC tokens
                        </p>
                      </motion.button>

                      {/* Card Payment */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPaymentMethod('card')}
                        className="p-4 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border border-blue-500/50 hover:border-blue-500 rounded-lg transition-all text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <CreditCard className="text-blue-400" size={20} />
                          <span className="font-bold text-white">Credit Card</span>
                        </div>
                        <p className="text-xs text-gray-300">${plans[selectedPlan].price}/month</p>
                      </motion.button>
                    </div>
                  </div>

                  {/* Free Trial Section */}
                  <div className="border-t border-gray-600 pt-6">
                    <p className="text-sm font-semibold text-gray-300 mb-3">Or try for free:</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        alert(`✅ Welcome to ${plans[selectedPlan].name} plan! Enjoy all features for free.`);
                        onClose();
                      }}
                      className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border border-green-500/50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>🎉 Try {plans[selectedPlan].name} Free</span>
                    </motion.button>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Get instant access to all {plans[selectedPlan].name} features without payment
                    </p>
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-gray-400 text-center">
                    7-day free trial. Cancel anytime.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
