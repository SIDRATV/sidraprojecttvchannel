'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trash2, Play } from 'lucide-react';
import { ContentSection } from '@/components/app/ContentSection';

const watchlistItems = [
  {
    id: '1',
    title: 'The Legacy of Innovation',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=600&fit=crop',
    duration: '58:32',
    category: 'Documentary',
  },
  {
    id: '2',
    title: 'Understanding Blockchain',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '48:23',
    category: 'Tutorial',
  },
  {
    id: '3',
    title: 'Future of Islamic Finance',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '45:30',
    category: 'Finance',
  },
  {
    id: '4',
    title: 'Community Impact Stories',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '52:15',
    category: 'Documentary',
  },
  {
    id: '5',
    title: 'Digital Transformation',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '41:20',
    category: 'Technology',
  },
  {
    id: '6',
    title: 'Technology & Society',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '38:45',
    category: 'Lecture',
  },
];

export default function WatchlistPage() {
  const [items, setItems] = useState(watchlistItems);

  const handleRemove = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-gray-950 dark:text-white mb-2">My Watchlist</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {items.length} video{items.length !== 1 ? 's' : ''} saved
        </p>
      </motion.div>

      {items.length > 0 ? (
        <>
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 pb-4 border-b border-gray-300 dark:border-gray-800 transition-colors"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Play size={16} />
              <span>Play All</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setItems([])}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </motion.button>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Remove Button */}
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </motion.button>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold mb-1">{item.title}</p>
                    <p className="text-xs text-gray-300">{item.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-2">Your watchlist is empty</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add videos to your watchlist to watch them later
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/explore"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            <span>Browse Content</span>
          </motion.a>
        </motion.div>
      )}
    </div>
  );
}
