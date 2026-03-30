'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Film, Search, Sparkles, Crown, Filter } from 'lucide-react';
import { PremiumVideoCard } from '@/components/premium/PremiumVideoCard';
import { premiumVideoService } from '@/services/premiumVideos';
import { categoryService } from '@/services/categories';
import { useAuth } from '@/hooks/useAuth';
import type { PremiumVideoWithRelations } from '@/types/premium';
import type { Category } from '@/types';
import Link from 'next/link';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function PremiumVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PremiumVideoWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Premium: user must be logged in and have a premium_plan set
  const isPremiumUser = !!(user && user.premium_plan);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});

    premiumVideoService.getVideos(50, 0, selectedCategory || undefined).then((data) => {
      setVideos(data);
      setLoading(false);
    });
  }, [selectedCategory]);

  const filteredVideos = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : videos;

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 transition-colors overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gold-500/5 dark:bg-gold-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-brand-500/5 dark:bg-brand-500/8 blur-3xl" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-4 md:p-8 lg:p-10 space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 shadow-lg shadow-gold-500/20">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-300 bg-clip-text text-transparent">
                Premium Videos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Exclusive content for premium subscribers</p>
            </div>
          </div>

          {/* Premium status badge */}
          {!isPremiumUser && (
            <Link href="/premium">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 cursor-pointer hover:border-gold-500/40 transition-all"
              >
                <Crown size={18} className="text-gold-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gold-600 dark:text-gold-400">Unlock Premium</span> — Subscribe to watch all exclusive content
                </p>
                <Sparkles size={14} className="text-gold-400 ml-auto" />
              </motion.div>
            </Link>
          )}
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search premium videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter size={12} />
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <motion.div variants={fadeUp} className="text-center py-20">
            <Film size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No premium videos found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'New content coming soon'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredVideos.map((video) => (
              <motion.div key={video.id} variants={fadeUp}>
                <PremiumVideoCard video={video} isPremiumUser={isPremiumUser} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
