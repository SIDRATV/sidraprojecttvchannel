'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Wallet, TrendingUp, Users, Newspaper, Play, Search } from 'lucide-react';
import Image from 'next/image';

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
    icon: Users,
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

const categories = ['All Videos', 'Documentaries', 'Tutorials', 'Inspirational', 'Interviews'];

const mockVideos = [
  { id: 1, title: 'Islamic Innovation Summit 2024', category: 'Documentaries', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300' },
  { id: 2, title: 'Tech Talks - Blockchain Future', category: 'Tutorials', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300' },
  { id: 3, title: 'Community Impact Stories', category: 'Inspirational', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300' },
  { id: 4, title: 'Expert Interviews', category: 'Interviews', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300' },
  { id: 5, title: 'Startup Journey', category: 'Documentaries', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300' },
  { id: 6, title: 'Web3 Fundamentals', category: 'Tutorials', image: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300' },
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
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
          >
            {exploreCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className={`h-80 bg-gradient-to-br ${card.gradient} rounded-2xl p-8 text-white cursor-pointer hover:shadow-2xl transition-all`}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                          <Icon size={32} />
                        </div>
                        <h2 className="text-3xl font-bold mb-3">{card.title}</h2>
                        <p className="text-lg opacity-90">{card.description}</p>
                      </div>
                      <div>
                        <div className="p-4 bg-white/10 rounded-lg mb-4">
                          <p className="font-semibold">{card.stats}</p>
                        </div>
                        <button className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors">
                          Explore →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Content Discovery Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-950 dark:text-white mb-4">
              Discover New Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Explore across all categories
            </p>
          </motion.div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3 mb-12">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Video Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mockVideos.map((video) => (
              <motion.div
                key={video.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group cursor-pointer rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={video.image}
                    alt={video.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">
                    {video.category}
                  </p>
                  <h3 className="text-lg font-bold text-gray-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
