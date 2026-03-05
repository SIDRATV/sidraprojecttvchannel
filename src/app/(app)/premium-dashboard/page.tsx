'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePremium } from '@/hooks/usePremium';
import { PremiumStatus } from '@/components/premium/PremiumStatus';
import { PremiumAnalytics } from '@/components/premium/PremiumAnalytics';
import { PaidSurveys } from '@/components/premium/PaidSurveys';
import { ReferralProgram } from '@/components/premium/ReferralProgram';
import { AlertCircle } from 'lucide-react';

export default function PremiumDashboardPage() {
  const { status, isLoading } = usePremium();
  const router = useRouter();

  useEffect(() => {
    // Redirect to try-premium if not premium user
    if (!isLoading && !status.isActive) {
      router.push('/try-premium');
    }
  }, [status.isActive, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Loading your premium dashboard...</p>
        </div>
      </div>
    );
  }

  if (!status.isActive) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-blue-900/20 dark:to-gray-950 py-12 px-4 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
            Welcome to Premium
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your subscription, earn rewards, and access exclusive content
          </p>
        </motion.div>

        {/* Premium Status Card */}
        <PremiumStatus />

        {/* SPTC Balance Alert */}
        {status.sptcBalance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-500/30 rounded-xl p-6 flex items-start gap-4"
          >
            <AlertCircle className="text-orange-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-gray-950 dark:text-white text-lg mb-2">You have {status.sptcBalance} SPTC available!</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Uses your tokens to upgrade your subscription, participate in surveys, or save for special events.
              </p>
            </div>
          </motion.div>
        )}

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white">Your Earnings & Analytics</h2>
          <PremiumAnalytics
            sptcEarned={status.sptcBalance}
            totalEarned={status.totalEarned}
            referrals={status.referrals}
          />
        </motion.div>

        {/* Paid Surveys Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white">Earn with Surveys</h2>
          <PaidSurveys />
        </motion.div>

        {/* Referral Program Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white">Referral Program</h2>
          <ReferralProgram />
        </motion.div>

        {/* Extra Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-300 dark:border-blue-500/20 rounded-xl p-8 space-y-6"
        >
          <h3 className="text-2xl font-bold text-gray-950 dark:text-white">More Premium Features Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Exclusive Content', desc: 'Access to premium documentaries and interviews' },
              { title: 'Creator Access', desc: 'Connect directly with content creators' },
              { title: 'Early Access', desc: 'Get first access to new content before others' },
            ].map((feature, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-semibold text-gray-950 dark:text-white">{feature.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
