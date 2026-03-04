'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trending2, Clock } from 'lucide-react';
import type { Podcast } from '@/services/podcasts';

const CATEGORIES = ['Technology', 'Business', 'AI & ML', 'Development', 'Marketing', 'Design'];

export default function PodcastPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewType, setViewType] = useState<'all' | 'trending' | 'recent'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 12;

  // Fetch podcasts from API
  useEffect(() => {
    const fetchPodcasts = async () => {
      setIsLoading(true);
      try {
        let url = '/api/podcasts?limit=50';
        
        if (viewType === 'trending') {
          url += '&type=trending';
        } else if (viewType === 'recent') {
          url += '&type=featured';
        }

        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setPodcasts(Array.isArray(data) ? data : []);
        setCurrentPage(0);
      } catch (error) {
        console.error('Error fetching podcasts:', error);
        setPodcasts([
          { id: 'p1', title: 'Tech Innovation Daily', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop', duration: '45 min', category: 'Technology', creator: 'Tech Leaders', views: 12500, likes: 890, created_at: new Date().toISOString() },
          { id: 'p2', title: 'Startup Stories', image: 'https://images.unsplash.com/photo-1516321318423-f06f70991a20?w=800&h=450&fit=crop', duration: '32 min', category: 'Business', creator: 'Startup Hub', views: 8900, likes: 650, created_at: new Date().toISOString() },
          { id: 'p3', title: 'Future of AI', image: 'https://images.unsplash.com/photo-1620712014215-c8ee9ae4aaae?w=800&h=450&fit=crop', duration: '58 min', category: 'AI & ML', creator: 'AI Masters', views: 15200, likes: 1205, created_at: new Date().toISOString() },
          { id: 'p4', title: 'Live Podcast: Innovation', image: 'https://images.unsplash.com/photo-1577720643272-265e434ff3a4?w=800&h=450&fit=crop', duration: 'LIVE', category: 'Podcast', creator: 'Live Team', views: 3200, likes: 420, created_at: new Date().toISOString() },
          { id: 'p5', title: 'Web Development Mastery', image: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=450&fit=crop', duration: '41 min', category: 'Development', creator: 'Dev Academy', views: 11000, likes: 780, created_at: new Date().toISOString() },
          { id: 'p6', title: 'Digital Marketing Trends', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop', duration: '36 min', category: 'Marketing', creator: 'Marketing Pros', views: 9500, likes: 680, created_at: new Date().toISOString() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, [viewType, selectedCategory]);

  // Search and filter logic
  useEffect(() => {
    let result = podcasts;

    if (searchQuery) {
      result = result.filter(podcast =>
        podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPodcasts(result);
    setCurrentPage(0);
  }, [searchQuery, podcasts]);

  const paginatedPodcasts = filteredPodcasts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredPodcasts.length / ITEMS_PER_PAGE);

  return (
    <main className="flex-1 overflow-y-auto pb-20 px-4 md:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-lg">
          <h1 className="text-4xl font-bold mb-2">Podcasts</h1>
          <p className="text-lg opacity-90">Explore our latest podcast episodes and series</p>
        </div>

        {/* Search & Controls */}
        <div className="space-y-4">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search podcasts by title or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              {['all', 'recent', 'trending'].map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewType(type as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    viewType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {type === 'trending' && <Trending2 size={16} />}
                  {type === 'recent' && <Clock size={16} />}
                  {type === 'all' && <Filter size={16} />}
                  <span className="capitalize">{type}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Categories
            </motion.button>
            {CATEGORIES.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"
            />
          </div>
        )}

        {/* Podcasts Grid */}
        {!isLoading && paginatedPodcasts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPodcasts.map((podcast) => (
                <motion.div
                  key={podcast.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 aspect-video">
                    <img
                      src={podcast.image}
                      alt={podcast.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-4 h-6 bg-white rounded-sm" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <h3 className="font-bold text-gray-950 dark:text-white line-clamp-2">{podcast.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{podcast.creator}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                        {podcast.category}
                      </span>
                      <span>{podcast.duration}</span>
                    </div>
                    <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>👁️ {(podcast.views / 1000).toFixed(1)}K</span>
                      <span>❤️ {podcast.likes}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </motion.button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === i
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {i + 1}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </motion.button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && paginatedPodcasts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={48} className="text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No podcasts found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </main>
  );
}
