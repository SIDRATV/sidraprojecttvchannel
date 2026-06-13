'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useIPTVChannels } from '@/hooks/useIPTVChannels';
import type { IPTVChannel } from '@/hooks/useIPTVChannels';

interface IPTVChannelSelectorProps {
  onSelect: (channel: IPTVChannel) => void;
  loading?: boolean;
}

// List of supported countries
const COUNTRIES = [
  { code: 'fr', label: '🇫🇷 France' },
  { code: 'us', label: '🇺🇸 États-Unis' },
  { code: 'gb', label: '🇬🇧 Royaume-Uni' },
  { code: 'de', label: '🇩🇪 Allemagne' },
  { code: 'es', label: '🇪🇸 Espagne' },
  { code: 'it', label: '🇮🇹 Italie' },
  { code: 'pt', label: '🇵🇹 Portugal' },
  { code: 'nl', label: '🇳🇱 Pays-Bas' },
  { code: 'br', label: '🇧🇷 Brésil' },
  { code: 'in', label: '🇮🇳 Inde' },
  { code: 'ru', label: '🇷🇺 Russie' },
  { code: 'cn', label: '🇨🇳 Chine' },
  { code: 'jp', label: '🇯🇵 Japon' },
  { code: 'kr', label: '🇰🇷 Corée du Sud' },
  { code: 'au', label: '🇦🇺 Australie' },
];

export function IPTVChannelSelector({ onSelect, loading = false }: IPTVChannelSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('fr');
  const { channels, loading: channelsLoading, error, categories } = useIPTVChannels(selectedCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Filter channels based on search and category
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || ch.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectChannel = (channel: IPTVChannel) => {
    onSelect(channel);
    setIsOpen(false);
    setSearchQuery('');
  };

  const countryLabel = COUNTRIES.find(c => c.code === selectedCountry)?.label || 'Pays';

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-950 dark:text-white">
        <Globe size={16} className="inline mr-2" />
        Importer depuis IPTV
      </label>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm"
        >
          <AlertCircle size={16} />
          Erreur: {error}
        </motion.div>
      )}

      {/* Country Selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {COUNTRIES.map((country) => (
          <motion.button
            key={country.code}
            onClick={() => {
              setSelectedCountry(country.code);
              setSelectedCategory('');
              setSearchQuery('');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedCountry === country.code
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {country.label}
          </motion.button>
        ))}
      </div>

      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          disabled={channelsLoading || loading}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-left text-gray-950 dark:text-white flex items-center justify-between hover:border-brand-400 dark:hover:border-brand-400 transition-colors disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            {channelsLoading || loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Globe size={16} className="text-brand-500" />
                Sélectionner une chaîne ({countryLabel})
              </>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto"
            >
              {/* Search and Filter */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Rechercher une chaîne..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-400"
                />

                {/* Category Filter */}
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-950 dark:text-white focus:outline-none focus:border-brand-400"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Channels List */}
              <div className="max-h-72 overflow-y-auto">
                {filteredChannels.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery || selectedCategory ? 'Aucune chaîne trouvée' : 'Chargement...'}
                  </div>
                ) : (
                  filteredChannels.map((channel) => (
                    <motion.button
                      key={`${channel.name}-${channel.url}`}
                      onClick={() => handleSelectChannel(channel)}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className="w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {channel.logo && (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-950 dark:text-white truncate">
                            {channel.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {channel.category}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
