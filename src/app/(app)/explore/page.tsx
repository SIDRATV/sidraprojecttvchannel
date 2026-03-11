'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Handshake, Newspaper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const exploreCards = [
  {
    href: '/explore/wallet',
    title: 'My Wallet',
    description: 'Manage your funds, view transactions, and control your digital wallet',
    icon: Wallet,
    gradient: 'from-purple-500 to-blue-500',
    stats: 'Balance: $12,450.50',
  },
  {
    href: '/explore/voting-project',
    title: 'Voting Projects',
    description: 'Vote on community projects and help shape the future of our platform',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-500',
    stats: '2,575 Active Votes',
  },
  {
    href: '/explore/partenariat',
    title: 'Partners',
    description: 'Discover and connect with innovative partners in our ecosystem',
    icon: Handshake,
    gradient: 'from-pink-500 to-rose-500',
    stats: '45+ Countries',
  },
  {
    href: '/explore/actualiter',
    title: 'Actualités',
    description: 'Stay updated with the latest news and announcements from our community',
    icon: Newspaper,
    gradient: 'from-orange-500 to-red-500',
    stats: '150+ Articles',
  },
];

export default function ExplorePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8 transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
          Explore Sidra
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Discover our comprehensive platform features and services
        </p>
      </motion.div>

      {/* Main Features Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
      >
        {exploreCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className={`relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} p-1 cursor-pointer group shadow-lg transition-all`}
              >
                {/* Colored Background */}
                <div className="absolute inset-0 bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 from-white to-gray-50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                  {/* Top Section */}
                  <div>
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-6 group-hover:shadow-lg transition-all`}
                    >
                      <Icon size={28} />
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all">
                      {card.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom Section */}
                  <div>
                    {/* Stats */}
                    <div className="mb-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                      <p className={`font-bold text-lg text-transparent bg-gradient-to-r ${card.gradient} bg-clip-text`}>
                        {card.stats}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-950 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-950 rounded-xl font-semibold group-hover:scale-105 transition-transform">
                      Explore
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Gradient Border */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Quick Stats */}
      <motion.section
        variants={itemVariants}
        className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-12 mb-16"
      >
        <h3 className="text-2xl font-bold text-gray-950 dark:text-white mb-8">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Users', value: '50K+', icon: '👥' },
            { label: 'Total Transactions', value: '$2.5M+', icon: '💰' },
            { label: 'Projects Voted', value: '145', icon: '📊' },
            { label: 'News Articles', value: '500+', icon: '📰' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-gray-950 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <p className="text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-16"
      >
        <h3 className="text-3xl font-bold text-gray-950 dark:text-white mb-8">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Secure Wallet', desc: 'Multi-currency support', emoji: '🔐' },
            { title: 'Community Voting', desc: 'Shape project decisions', emoji: '🗳️' },
            { title: 'Strategic Partnerships', desc: 'Grow together', emoji: '🤝' },
            { title: 'Real-time News', desc: 'Stay informed', emoji: '📡' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h4 className="font-bold text-gray-950 dark:text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center"
      >
        <h3 className="text-3xl font-bold mb-4">Ready to explore?</h3>
        <p className="text-blue-100 mb-8 text-lg">Choose any section to start discovering amazing features</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/explore/wallet">
            <Button size="lg" variant="primary" className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
