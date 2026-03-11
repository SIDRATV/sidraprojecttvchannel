'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Wallet, Send, Plus, Eye, EyeOff, TrendingUp, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount: 500,
    description: 'Video monetization reward',
    timestamp: '2 hours ago',
    status: 'completed',
  },
  {
    id: '2',
    type: 'send',
    amount: 100,
    description: 'Donation to creator',
    timestamp: '5 hours ago',
    status: 'completed',
  },
  {
    id: '3',
    type: 'deposit',
    amount: 1000,
    description: 'Bank deposit',
    timestamp: '1 day ago',
    status: 'completed',
  },
  {
    id: '4',
    type: 'send',
    amount: 250,
    description: 'Pending transfer',
    timestamp: '2 days ago',
    status: 'pending',
  },
];

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'settings'>('overview');

  const balance = 12450.50;
  const monthlyEarnings = 3200;
  const totalSpent = 1850;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8 transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Wallet className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">My Wallet</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage your funds and transactions</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Main Balance Card */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg"
        >
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-purple-200 text-sm mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold">
                  {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            {/* SVG Wallet Icon */}
            <svg className="w-12 h-12 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V5a3 3 0 00-3-3H7a3 3 0 00-3 3v11a3 3 0 003 3z" />
            </svg>
          </div>

          <div className="flex items-end justify-between pt-8 border-t border-white/20">
            <div>
              <p className="text-purple-200 text-xs mb-1">Card Number</p>
              <p className="text-lg font-mono">•••• •••• •••• 4821</p>
            </div>
            <div>
              <p className="text-purple-200 text-xs mb-1">Valid Thru</p>
              <p className="text-lg font-mono">12/26</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Monthly Earnings */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Monthly Earnings</p>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">${monthlyEarnings}</p>
          </div>

          {/* Total Spent */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">Total Spent</p>
              <ArrowDownUp className="text-red-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">${totalSpent}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <Button size="lg" variant="primary" className="flex items-center gap-2">
          <Send size={20} />
          Send Money
        </Button>
        <Button size="lg" variant="secondary" className="flex items-center gap-2">
          <Plus size={20} />
          Add Funds
        </Button>
        <Button size="lg" variant="secondary" className="flex items-center gap-2">
          <ArrowDownUp size={20} />
          Convert Currency
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800"
      >
        {(['overview', 'transactions', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-3 font-medium transition-colors relative ${
              selectedTab === tab
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {selectedTab === tab && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 dark:bg-purple-400"
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Content Sections */}
      <motion.div variants={itemVariants}>
        {selectedTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Cards', value: '2' },
                { label: 'Linked Accounts', value: '3' },
                { label: 'Pending Transfers', value: '1' },
                { label: 'Monthly Limit', value: '$50,000' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-950 dark:text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {selectedTab === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="font-semibold text-gray-950 dark:text-white mb-4">Recent Transactions</h3>
            {mockTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === 'send' ? 'bg-red-100 dark:bg-red-900/30' :
                    tx.type === 'receive' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Send className={`${
                      tx.type === 'send' ? 'text-red-600 dark:text-red-400' :
                      tx.type === 'receive' ? 'text-green-600 dark:text-green-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-950 dark:text-white">{tx.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tx.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'receive' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-950 dark:text-white'
                  }`}>
                    {tx.type === 'receive' ? '+' : '-'}${tx.amount}
                  </p>
                  <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {selectedTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-2xl">
            <h3 className="font-semibold text-gray-950 dark:text-white mb-4">Wallet Settings</h3>
            
            {[
              { label: 'Notification Preferences', description: 'Control transaction alerts' },
              { label: 'Security Settings', description: 'Manage authentication methods' },
              { label: 'Linked Accounts', description: 'Add or remove bank accounts' },
              { label: 'Transaction Limits', description: 'Set daily spending limits' },
            ].map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 5 }}
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <p className="font-medium text-gray-950 dark:text-white">{item.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
