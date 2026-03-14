'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Wallet, TrendingUp, Users, Newspaper } from 'lucide-react';

interface ExploreCard {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  stats: string;
}

const exploreCards: ExploreCard[] = [
  {
    href: '/explore/wallet',
    title: 'My Wallet',
    description: 'Manage your digital assets and track all your transactions securely in one place',
    icon: Wallet,
    gradient: 'from-purple-500 to-blue-500',
    stats: '10+ Digital Currencies',
  },
  {
    href: '/explore/voting-project',
    title: 'Voting Projects',
    description: 'Participate in community decisions and vote on innovative projects that matter',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-500',
    stats: '2,500+ Active Votes',
  },
  {
    href: '/explore/partenariat',
    title: 'Partnership',
    description: 'Connect with visionary partners and build meaningful collaborations across borders',
    icon: Users,
    gradient: 'from-pink-500 to-rose-500',
    stats: '45+ Countries',
  },
  {
    href: '/explore/actualiter',
    title: 'Latest News',
    description: 'Stay informed with breaking news and inspiring stories from our global community',
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Main Features Section */}
      <section className="py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-950 dark:text-white mb-4">
              Explore Sidra
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover our comprehensive platform features and services
            </p>
          </motion.div>

          {/* 4 Main Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-20"
          >
            {exploreCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className={`h-64 md:h-80 bg-gradient-to-br ${card.gradient} rounded-2xl p-3 md:p-8 text-white cursor-pointer hover:shadow-2xl transition-all flex flex-col justify-between`}
                  >
                    <div className="flex-1">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-lg flex items-center justify-center mb-2 md:mb-4">
                        <Icon size={24} className="md:w-8 md:h-8" />
                      </div>
                      <h2 className="text-xl md:text-3xl font-bold mb-2 line-clamp-2">{card.title}</h2>
                      <p className="text-sm md:text-lg opacity-90 line-clamp-3">{card.description}</p>
                    </div>
                    <div>
                      <div className="p-2 md:p-4 bg-white/10 rounded-lg mb-2 md:mb-4">
                        <p className="font-semibold text-sm md:text-base line-clamp-1">{card.stats}</p>
                      </div>
                      <button className="inline-flex items-center gap-2 px-4 md:px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors text-sm md:text-base">
                        Explore →
                      </button>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
