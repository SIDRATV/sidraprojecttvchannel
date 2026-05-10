'use client';

import { motion } from 'framer-motion';
import { Trash2, Play, Clock, History } from 'lucide-react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { YouTubePlayerModal } from '@/components/app/YouTubePlayerModal';
import { useState } from 'react';
import Link from 'next/link';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

function hoursLeft(ts: number): string {
  const remaining = 24 * 60 * 60 * 1000 - (Date.now() - ts);
  if (remaining <= 0) return 'expiré';
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  return h > 0 ? `expire dans ${h}h${m > 0 ? m + 'min' : ''}` : `expire dans ${m}min`;
}

export default function WatchlistPage() {
  const { history, clearHistory } = useWatchHistory();
  const [playerVideo, setPlayerVideo] = useState<{ videoId: string; title: string } | null>(null);

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <History size={28} className="text-brand-500" />
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Récemment regardés</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          <span>
            {history.length > 0
              ? `${history.length} vidéo${history.length > 1 ? 's' : ''} — se réinitialise automatiquement après 24h`
              : 'Aucune vidéo regardée ces dernières 24h'}
          </span>
        </div>
      </motion.div>

      {history.length > 0 ? (
        <>
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-800"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/20 rounded-lg transition-colors text-sm"
            >
              <Trash2 size={15} />
              <span>Tout effacer</span>
            </motion.button>
          </motion.div>

          {/* Grid — small compact cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            {history.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.watchedAt}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative cursor-pointer"
                onClick={() => item.videoId && setPlayerVideo({ videoId: item.videoId, title: item.title })}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-brand-500/90 flex items-center justify-center">
                      <Play size={16} fill="currentColor" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                      {item.duration}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-1.5 px-0.5">
                  <p className="text-xs font-semibold text-gray-950 dark:text-white line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {timeAgo(item.watchedAt)}
                  </p>
                  <p className="text-[10px] text-brand-400 mt-0.5">
                    {hoursLeft(item.watchedAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-2">
            Aucune vidéo regardée
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Les vidéos que vous regardez apparaîtront ici pendant 24h.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            <Play size={16} />
            Explorer les vidéos
          </Link>
        </motion.div>
      )}

      {/* Player modal */}
      {playerVideo && (
        <YouTubePlayerModal
          videoId={playerVideo.videoId}
          title={playerVideo.title}
          isOpen={true}
          onClose={() => setPlayerVideo(null)}
        />
      )}
    </div>
  );
}
