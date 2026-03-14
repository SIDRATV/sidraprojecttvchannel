'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Flame, Radio } from 'lucide-react';
import type { LiveStream } from '@/services/live';

const CATEGORIES = ['Conference', 'Workshop', 'Education', 'Podcast', 'Event', 'Design', 'Development'];

export default function LivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewType, setViewType] = useState<'all' | 'active' | 'featured'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 12;

  // Fetch live streams from API
  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        let url = '/api/live?limit=50';
        
        if (viewType === 'active') {
          url += '&type=active';
        } else if (viewType === 'featured') {
          url += '&type=featured';
        }

        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }

        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();
        setStreams(Array.isArray(data) ? data : []);
        setCurrentPage(0);
      } catch (error) {
        console.error('Error fetching live streams:', error);
        // Fallback demo data
        setStreams([
          { id: 'l1', title: 'Tech Conference 2024', description: 'Live conference', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop', viewers: 12500, category: 'Conference', streamer: 'Tech Summit', is_live: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'l2', title: 'Web Dev Workshop', description: 'Live workshop', image: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=450&fit=crop', viewers: 5800, category: 'Workshop', streamer: 'Dev Academy', is_live: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'l3', title: 'AI Masterclass', description: 'Live AI class', image: 'https://images.unsplash.com/photo-1618761490192-04901461159e?w=800&h=450&fit=crop', viewers: 8300, category: 'Education', streamer: 'AI Masters', is_live: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'l4', title: 'Live Podcast: Innovation', description: 'Podcast session', image: 'https://images.unsplash.com/photo-1577720643272-265e434ff3a4?w=800&h=450&fit=crop', viewers: 3200, category: 'Podcast', streamer: 'Live Team', is_live: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'l5', title: 'Startup Pitch Event', description: 'Startup pitches', image: 'https://images.unsplash.com/photo-1516321318423-f06f70991a20?w=800&h=450&fit=crop', viewers: 15200, category: 'Event', streamer: 'Startup Hub', is_live: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'l6', title: 'Design Talk Show', description: 'Design discussion', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop', viewers: 4700, category: 'Design', streamer: 'Design Pro', is_live: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, [viewType, selectedCategory]);

  // Search and filter logic
  useEffect(() => {
    let result = streams;

    if (searchQuery) {
      result = result.filter(stream =>
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.streamer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStreams(result);
    setCurrentPage(0);
  }, [searchQuery, streams]);

  const paginatedStreams = filteredStreams.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredStreams.length / ITEMS_PER_PAGE);

  return (
    <main className="flex-1 overflow-y-auto pb-20 px-4 md:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-lg">
          <h1 className="text-4xl font-bold mb-2">Live Streams</h1>
          <p className="text-lg opacity-90">Watch live streams and events happening right now</p>
        </div>

        {/* Search & Controls */}
        <div className="space-y-6">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search streams by title or streamer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
            />
          </motion.div>

          {/* Filter Controls Container */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            {/* Filter Tabs */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">View Type</p>
              <div className="flex gap-2">
                {['active', 'featured', 'all'].map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewType(type as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      viewType === type
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type === 'active' && <Radio size={16} className="text-red-500" />}
                    {type === 'featured' && <Flame size={16} />}
                    {type === 'all' && <Filter size={16} />}
                    <span className="capitalize">{type}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === ''
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </motion.button>
                {CATEGORIES.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full"
            />
          </div>
        )}

        {/* Live Streams Grid */}
        {!isLoading && paginatedStreams.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStreams.map((stream) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 aspect-video">
                    <img
                      src={stream.image}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-3 h-4 bg-white rounded-sm" />
                      </motion.div>
                    </div>
                    {/* Live Badge */}
                    {stream.is_live && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </motion.div>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <h3 className="font-bold text-gray-950 dark:text-white line-clamp-2">{stream.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stream.streamer}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                        {stream.category}
                      </span>
                      <span className="flex items-center gap-1">
                        📺 {(stream.viewers / 1000).toFixed(1)}K watching
                      </span>
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
                  className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ? 'bg-red-600 text-white'
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
                  className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </motion.button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && paginatedStreams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Radio size={48} className="text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No live streams found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Check back later for live content</p>
          </div>
        )}
      </div>
    </main>
  );
}
