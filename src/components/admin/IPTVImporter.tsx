'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Grid3x3, List } from 'lucide-react';
import { useIPTVChannels } from '@/hooks/useIPTVChannels';

interface IPTVImportProps {
  onImport: (channel: {
    title: string;
    description: string;
    stream_url: string;
    stream_type: 'youtube' | 'obs' | 'other';
    category: string;
    image: string;
  }) => Promise<void>;
  token: string;
}

export function IPTVImporter({ onImport, token }: IPTVImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [importing, setImporting] = useState<string | null>(null);

  const { channels, loading, error, categories, refetch } = useIPTVChannels(selectedCategory);

  const handleImport = async (channel: typeof channels[0]) => {
    setImporting(channel.name);
    try {
      await onImport({
        title: channel.name,
        description: `Stream IPTV - ${channel.groupTitle || channel.category}`,
        stream_url: channel.url,
        stream_type: 'other',
        category: channel.groupTitle || channel.category,
        image: channel.logo || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(channel.name),
      });
    } finally {
      setImporting(null);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 text-white rounded-lg font-medium text-sm w-full md:w-fit shadow-lg shadow-purple-500/20 transition-all"
      >
        <Plus size={18} />
        Importer Chaînes IPTV
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Importer Chaînes IPTV Françaises</h2>
              <p className="text-sm text-purple-100 mt-1">Source: iptv-org.github.io</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-purple-400/30 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg mb-4">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Aucune chaîne disponible dans cette catégorie</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {channels.map((channel) => (
                  <motion.div
                    key={`${channel.country}-${channel.name}`}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleImport(channel)}
                  >
                    <div className="relative overflow-hidden h-32 bg-gray-200 dark:bg-gray-600">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600">
                          <span className="text-white text-xs font-semibold text-center px-2 line-clamp-2">
                            {channel.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        {importing === channel.name ? (
                          <Loader2 size={20} className="animate-spin text-white" />
                        ) : (
                          <Plus size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {channel.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {channel.category}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {channels.map((channel) => (
                  <motion.div
                    key={`${channel.country}-${channel.name}`}
                    whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                    onClick={() => handleImport(channel)}
                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{channel.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{channel.category}</p>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 group-hover:text-purple-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 rounded-lg transition-all"
                      disabled={importing === channel.name}
                    >
                      {importing === channel.name ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
