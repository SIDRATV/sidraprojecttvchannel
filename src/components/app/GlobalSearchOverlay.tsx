'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Video, Crown, Radio, Mic2, Newspaper, Loader2, SearchX, Building2, Megaphone, BoxesIcon, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { GlobalSearchResults, GlobalSearchResult } from '@/hooks/useGlobalSearch';

interface GlobalSearchOverlayProps {
  query: string;
  results: GlobalSearchResults;
  loading: boolean;
  onClose: () => void;
}

const TYPE_META: Record<GlobalSearchResult['type'], { label: string; icon: React.ElementType; color: string }> = {
  video: { label: 'Vidéo', icon: Video, color: 'text-blue-500' },
  premium_video: { label: 'Vidéo Premium', icon: Crown, color: 'text-yellow-500' },
  live: { label: 'Live', icon: Radio, color: 'text-red-500' },
  podcast: { label: 'Podcast', icon: Mic2, color: 'text-purple-500' },
  news: { label: 'Actualité', icon: Newspaper, color: 'text-green-500' },
  partner: { label: 'Partenaire', icon: Building2, color: 'text-orange-500' },
  advertisement: { label: 'Publicité', icon: Megaphone, color: 'text-pink-500' },
  voting_project: { label: 'Projet de vote', icon: BoxesIcon, color: 'text-cyan-500' },
  category: { label: 'Catégorie', icon: FolderOpen, color: 'text-indigo-500' },
};

function ResultItem({ item, onClose }: { item: GlobalSearchResult; onClose: () => void }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors rounded-lg group"
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-8 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={14} className={meta.color} />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
        )}
      </div>

      {/* Type badge */}
      <span className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${meta.color}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    </Link>
  );
}

function Section({
  title,
  items,
  onClose,
}: {
  title: string;
  items: GlobalSearchResult[];
  onClose: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {title}
      </p>
      {items.map((item) => (
        <ResultItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  );
}

export function GlobalSearchOverlay({ query, results, loading, onClose }: GlobalSearchOverlayProps) {
  const trimmed = query.trim();
  const hasResults =
    results.videos.length > 0 ||
    results.premiumVideos.length > 0 ||
    results.liveStreams.length > 0 ||
    results.podcasts.length > 0 ||
    results.news.length > 0 ||
    results.partners.length > 0 ||
    results.advertisements.length > 0 ||
    results.votingProjects.length > 0 ||
    results.categories.length > 0;

  const show = trimmed.length >= 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Recherche en cours…</span>
            </div>
          ) : hasResults ? (
            <div className="py-2 space-y-1">
              <Section title="Vidéos" items={results.videos} onClose={onClose} />
              <Section title="Vidéos Premium" items={results.premiumVideos} onClose={onClose} />
              <Section title="Lives" items={results.liveStreams} onClose={onClose} />
              <Section title="Podcasts" items={results.podcasts} onClose={onClose} />
              <Section title="Actualités" items={results.news} onClose={onClose} />
              <Section title="Partenaires" items={results.partners} onClose={onClose} />
              <Section title="Publicités" items={results.advertisements} onClose={onClose} />
              <Section title="Projets de vote" items={results.votingProjects} onClose={onClose} />
              <Section title="Catégories" items={results.categories} onClose={onClose} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <SearchX size={24} />
              <span className="text-sm">Aucun résultat pour « {trimmed} »</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
