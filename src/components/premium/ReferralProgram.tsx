'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Referral {
  id: string;
  name: string;
  email: string;
  plan: 'pro' | 'premium' | 'vip';
  joinedDate: string;
  rewards: number;
  status: 'active' | 'inactive';
}

export function ReferralProgram() {
  const { user } = useAuth();
  // Referrals will be fetched from DB when referral table is created
  const [referrals] = useState<Referral[]>([]);

  const [copied, setCopied] = useState(false);
  const referralCode = user?.username || user?.id?.slice(0, 8) || 'USER';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/ref/${referralCode}`
    : `https://sidra.tv/ref/${referralCode}`;
  const totalRewards = referrals.reduce((acc, r) => acc + r.rewards, 0);
  const activeReferrals = referrals.filter((r) => r.status === 'active').length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const planRewards = {
    pro: 50,
    premium: 100,
    vip: 150,
  };

  return (
    <section className="space-y-8">
      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-8 space-y-6"
      >
        <h3 className="text-2xl font-bold text-gray-950 dark:text-white">How Referral Program Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: '1', title: 'Share Your Link', desc: 'Copy your unique referral link and share with friends' },
            { num: '2', title: 'They Join', desc: 'Friends sign up using your referral link' },
            { num: '3', title: 'Earn Rewards', desc: 'Get SPTC when they activate premium' },
          ].map((step, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full text-lg font-bold text-white">
                {step.num}
              </div>
              <h4 className="font-semibold text-gray-950 dark:text-white">{step.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/30 rounded-xl p-8 space-y-4"
      >
        <h3 className="text-xl font-bold text-gray-950 dark:text-white flex items-center gap-2">
          <Share2 className="text-green-400" />
          Your Unique Referral Link
        </h3>

        <div className="flex gap-3">
          <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 flex items-center">
            <code className="text-sm text-gray-400 break-all">{referralLink}</code>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
          >
            {copied ? (
              <>
                <CheckCircle size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Active Referrals</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{activeReferrals}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Friends who joined</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Total Rewards</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">{totalRewards}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">SPTC Earned</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-xl p-6"
        >
          <h3 className="text-gray-700 dark:text-gray-400 text-sm font-medium mb-2">Next Reward</h3>
          <p className="text-4xl font-bold text-gray-950 dark:text-white">+50</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">SPTC per referral</p>
        </motion.div>
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-950 dark:text-white">Your Referrals</h3>

        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rewards</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <motion.tr
                    key={referral.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{referral.name}</p>
                        <p className="text-xs text-gray-400">{referral.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full capitalize">
                        {referral.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(referral.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-400">
                      +{referral.rewards} SPTC
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          referral.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
