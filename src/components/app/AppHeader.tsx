'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

interface AppHeaderProps {
  onSearch?: (query: string) => void;
}

export function AppHeader({ onSearch }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors"
    >
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-10 h-10 flex-shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Sidra Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          <div>
            <h1 className="font-bold text-lg text-gray-950 dark:text-white">Sidra</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">TV Channel</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
          <motion.div whileFocus={{ scale: 1.02 }} className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, channels, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </motion.div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            {isDark ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} />
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
