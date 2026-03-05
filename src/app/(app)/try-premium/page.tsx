'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Star, X, Lock, Coins, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePremium } from '@/hooks/usePremium';

export default function TryPremiumPage() {
  const router = useRouter();
  const { activatePremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | 'vip'>('premium');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'free' | 'sptc' | 'card'>('free');

  const plans = [
    {
      id: 'pro',
      name: 'Pro',
      description: 'Great for getting started',
      icon: Zap,
      price: '$9.99',
      sptc: '100 SPTC',
      features: [
        'Up to 1080p streaming',
        'Download 5 videos',
        'Early access (24h)',
        '100 SPTC / month',
      ],
      color: 'from-blue-600 to-blue-500',
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Most popular choice',
      icon: Crown,
      price: '$19.99',
      sptc: '200 SPTC',
      features: [
        '4K Ultra HD streaming',
        'Download unlimited videos',
        'Early access (48h)',
        '200 SPTC / month',
        'Ad-free experience',
        'VIP Creator access',
      ],
      color: 'from-yellow-600 to-orange-600',
      isPopular: true,
    },
    {
      id: 'vip',
      name: 'VIP',
      description: 'Ultimate experience',
      icon: Star,
      price: '$29.99',
      sptc: '300 SPTC',
      features: [
        'All Premium features',
        '4K + Lossless audio',
        'VIP events access',
        '300 SPTC / month',
        'Private creator sessions',
        'Investor insights dashboard',
        'Premium support 24/7',
      ],
      color: 'from-purple-600 to-pink-600',
    },
  ];

  const handleUnlock = (planId: string) => {
    setShowPaymentModal(true);
  };

  const handlePayment = (method: 'free' | 'sptc' | 'card') => {
    setSelectedPayment(method);
    
    if (method === 'card') {
      alert('💳 Credit Card Payment\n\nThis feature is coming soon! Payment processing will be integrated shortly.');
      return;
    }

    if (method === 'sptc') {
      alert('⏳ SPTC Token Payment\n\nThis feature is coming soon! You\'ll be able to use your SPTC tokens to unlock premium plans.');
      return;
    }

    // Activate with free method
    activatePremium(selectedPlan, 'free');
    const planName = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
    alert(`✅ Success! You now have access to the ${planName} plan!\n\nAll features are unlocked and ready to use.`);
    setShowPaymentModal(false);
    router.push('/premium-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-900/20 to-gray-950 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Try Premium
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              For Free
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose any plan and unlock all features instantly. No credit card required.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                onClick={() => setSelectedPlan(plan.id as 'pro' | 'premium' | 'vip')}
                className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-xl shadow-blue-500/20'
                    : 'border-gray-700 bg-gray-800/40 hover:border-blue-500/50'
                }`}
              >
                {plan.isPopular && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2"
                  >
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs font-bold rounded-full">
                      Most Popular
                    </span>
                  </motion.div>
                )}

                <div className="p-8 space-y-6">
                  {/* Icon & Title */}
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                    >
                      <Icon size={24} className="text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 pb-6 border-b border-gray-700">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-sm text-orange-400 font-semibold">{plan.sptc}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <Check size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUnlock(plan.id)}
                    className={`w-full py-3 rounded-lg font-bold transition-all mt-8 ${
                      isSelected
                        ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {isSelected ? `🎉 Unlock ${plan.name}` : 'Select Plan'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-8 text-center space-y-4"
        >
          <h3 className="text-2xl font-bold text-white">No Strings Attached</h3>
          <ul className="flex flex-wrap justify-center gap-8 text-gray-300">
            <li className="flex items-center gap-2">
              <span>✅</span> Full access to all plan features
            </li>
            <li className="flex items-center gap-2">
              <span>✅</span> No credit card required
            </li>
            <li className="flex items-center gap-2">
              <span>✅</span> Cancel anytime
            </li>
          </ul>
        </motion.div>

        {/* Payment Method Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPaymentModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Choose Payment Method</h3>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X size={24} className="text-gray-400" />
                    </button>
                  </div>

                  <p className="text-gray-400 text-center">
                    Select how you would like to pay for the <span className="font-bold text-white capitalize">{selectedPlan}</span> plan
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Free Trial Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePayment('free')}
                      className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500 hover:shadow-lg hover:shadow-green-500/50 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">Free Trial</h4>
                          <p className="text-sm text-green-100">Start immediately with full access</p>
                        </div>
                        <Check size={24} className="text-white" />
                      </div>
                    </motion.button>

                    {/* SPTC Token Option - Coming Soon */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled
                      className="p-6 bg-gradient-to-r from-orange-600/50 to-yellow-600/50 border-2 border-dashed border-orange-500/50 rounded-xl text-left transition-all opacity-75 cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Coins size={18} className="text-orange-300" />
                            <h4 className="text-lg font-bold text-white">SPTC Tokens</h4>
                            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">Coming Soon</span>
                          </div>
                          <p className="text-sm text-orange-100">Pay with SPTC earned from surveys & referrals</p>
                        </div>
                        <Lock size={24} className="text-gray-500" />
                      </div>
                    </motion.button>

                    {/* Credit Card Option - Coming Soon */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled
                      className="p-6 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 border-2 border-dashed border-blue-500/50 rounded-xl text-left transition-all opacity-75 cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard size={18} className="text-blue-300" />
                            <h4 className="text-lg font-bold text-white">Credit Card</h4>
                            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">Coming Soon</span>
                          </div>
                          <p className="text-sm text-blue-100">Visa, Mastercard, and other payment methods</p>
                        </div>
                        <Lock size={24} className="text-gray-500" />
                      </div>
                    </motion.button>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
