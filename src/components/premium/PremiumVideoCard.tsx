'use client';

import { motion } from 'framer-motion';
import { Play, Lock, Eye, Clock, Crown, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { PremiumVideoWithRelations } from '@/types/premium';

interface PremiumVideoCardProps {
  video: PremiumVideoWithRelations;
  isPremiumUser: boolean;
}

export function PremiumVideoCard({ video, isPremiumUser }: PremiumVideoCardProps) {
  const [showSummary, setShowSummary] = useState(false);

  const href = isPremiumUser
    ? `/premium-videos/${video.id}`
    : '/premium';

  const qualityBadge = video.quality_options?.includes('1080p')
    ? '1080p'
    : video.quality_options?.includes('720p')
    ? '720p'
    : '480p';

  const planColors: Record<string, string> = {
    pro: 'from-brand-500 to-brand-400',
    premium: 'from-gold-500 to-gold-400',
    vip: 'from-purple-600 to-pink-600',
  };

  return (
    <div className="relative group">
      <Link href={href}>
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800/60 hover:border-gold-400/50 dark:hover:border-gold-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-gold-500/10"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Play size={40} className="text-gray-600" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Play button center */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isPremiumUser ? (
                <div className="p-3.5 bg-brand-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-brand-500/30">
                  <Play size={24} className="text-white" fill="white" />
                </div>
              ) : (
                <div className="p-3.5 bg-gold-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-gold-500/30">
                  <Lock size={24} className="text-white" />
                </div>
              )}
            </div>

            {/* Top badges */}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r ${planColors[video.min_plan] || planColors.pro}`}>
                {video.min_plan.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">
                {qualityBadge}
              </span>
            </div>

            {/* Duration */}
            {video.duration && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Clock size={10} />
                {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
              </span>
            )}

            {/* Premium lock overlay for non-premium users */}
            {!isPremiumUser && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center space-y-1">
                  <Lock className="w-8 h-8 text-gold-400 mx-auto" />
                  <p className="text-white text-xs font-semibold">Premium Only</p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3.5">
            {/* Category badge */}
            {video.categories && (
              <span className="inline-block px-2 py-0.5 mb-2 rounded-md text-[11px] font-semibold bg-gold-500/10 dark:bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                {video.categories.name}
              </span>
            )}

            <h3 className="font-bold text-gray-950 dark:text-white text-sm leading-snug line-clamp-2 mb-1.5">
              {video.title}
            </h3>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {video.views} views
              </span>
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Info/Summary button */}
      {video.description && (
        <div className="absolute bottom-1 right-1 z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSummary(!showSummary);
            }}
            className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
            title="Show summary"
          >
            <Info size={14} className="text-gold-500" />
          </motion.button>

          {/* Summary popup */}
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute bottom-10 right-0 w-64 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-50"
            >
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {video.description}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-[10px] text-gray-400">
                <Crown size={10} className="text-gold-500" />
                Requires {video.min_plan.charAt(0).toUpperCase() + video.min_plan.slice(1)} plan
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
