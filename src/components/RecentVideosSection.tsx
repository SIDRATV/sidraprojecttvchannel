'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Eye,
  Heart,
  Clock,
  Film,
  Lock,
  LogIn,
  X,
  Loader2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { videoService } from '@/services/videos';
import { premiumVideoService } from '@/services/premiumVideos';
import type { VideoWithRelations } from '@/types';
import type { PremiumVideoWithRelations } from '@/types/premium';

// Unified video type for display
interface DisplayVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  views: number;
  likes: number;
  created_at: string;
  category_name: string;
  uploader_name: string;
  isPremium: boolean;
  min_plan?: string;
}

function formatViews(views: number): string {
  if (!views) return '0 vue';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M vues`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K vues`;
  return `${views} vue${views > 1 ? 's' : ''}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getThumbnailFromVideo(video: VideoWithRelations): string {
  if (video.thumbnail_url) return video.thumbnail_url;
  const ytId = getYouTubeId(video.video_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return PLACEHOLDER;
}

function normalizeVideos(videos: VideoWithRelations[]): DisplayVideo[] {
  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description || '',
    thumbnail_url: getThumbnailFromVideo(v),
    video_url: v.video_url,
    duration: v.duration || 0,
    views: v.views || 0,
    likes: v.likes || 0,
    created_at: v.created_at,
    category_name: v.categories?.name || '',
    uploader_name: v.users?.full_name || '',
    isPremium: false,
  }));
}

function normalizePremiumVideos(videos: PremiumVideoWithRelations[]): DisplayVideo[] {
  return videos.map((v) => ({
    id: `premium-${v.id}`,
    title: v.title,
    description: v.description || '',
    thumbnail_url: v.thumbnail_url || PLACEHOLDER,
    video_url: '',
    duration: v.duration || 0,
    views: v.views || 0,
    likes: v.likes || 0,
    created_at: v.created_at,
    category_name: v.categories?.name || '',
    uploader_name: '',
    isPremium: true,
    min_plan: v.min_plan,
  }));
}

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' fill='%23111827'%3E%3Crect width='640' height='360'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='40' fill='%234b5563'%3E▶%3C/text%3E%3C/svg%3E";

export function RecentVideosSection() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<DisplayVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<DisplayVideo | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [regularData, premiumData] = await Promise.all([
          videoService.getVideos(12),
          premiumVideoService.getVideos(8),
        ]);
        const regular = normalizeVideos(Array.isArray(regularData) ? regularData : []);
        const premium = normalizePremiumVideos(Array.isArray(premiumData) ? premiumData : []);
        // Merge and sort by most recent
        const merged = [...regular, ...premium].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setVideos(merged);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleVideoClick = useCallback((video: DisplayVideo) => {
    if (!user) {
      // Not logged in — show login prompt
      setSelectedVideo(video);
      setShowLoginPrompt(true);
      return;
    }
    if (video.isPremium) {
      // Premium video — go to premium content page
      const realId = video.id.replace('premium-', '');
      window.location.href = `/premium?video=${realId}`;
    } else {
      window.location.href = `/video/${video.id}`;
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20">
              <Clock size={20} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">Vidéos Récentes</h2>
          </div>
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0 && !loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20">
              <Clock size={20} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">Vidéos Récentes</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
              <Film size={32} className="text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Aucune vidéo pour le moment</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Les vidéos récentes apparaîtront ici</p>
          </div>
        </div>
      </section>
    );
  }

  // Split: first 4 are "hero" large cards, rest are smaller
  const heroVideos = videos.slice(0, 4);
  const gridVideos = videos.slice(4);

  return (
    <>
      <section className="py-16 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20">
                    <Clock size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">Vidéos Récentes</h2>
                </div>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 ml-[52px]" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-[52px]">
                  Découvrez les dernières vidéos de l&#39;écosystème Sidra
                </p>
              </div>
              {!user && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 dark:bg-gold-500/15 border border-gold-500/20 rounded-full">
                  <Lock size={14} className="text-gold-500" />
                  <span className="text-xs font-medium text-gold-600 dark:text-gold-400">
                    Connectez-vous pour regarder
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hero Row — 4 Large Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6"
          >
            {heroVideos.map((video) => (
              <motion.div key={video.id} variants={itemVariants}>
                <div
                  onClick={() => handleVideoClick(video)}
                  className="relative w-full h-60 md:h-72 rounded-2xl overflow-hidden group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />

                  {/* Premium Badge */}
                  {video.isPremium && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-gold-500 to-amber-400 rounded-lg shadow-lg shadow-gold-500/30 z-10">
                      <Crown size={12} className="text-white" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Premium</span>
                    </div>
                  )}

                  {/* Duration Badge */}
                  {video.duration > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs text-white font-medium">
                      {formatDuration(video.duration)}
                    </div>
                  )}

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className="relative"
                    >
                      <div className="w-16 h-16 bg-brand-500/30 backdrop-blur-md rounded-full flex items-center justify-center border border-brand-500/50 group-hover:bg-brand-500/60 transition-all shadow-lg shadow-brand-500/20">
                        {user ? (
                          <Play size={28} className="text-white fill-white ml-1" />
                        ) : (
                          <Lock size={24} className="text-white" />
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    {video.category_name && (
                      <span className="inline-block px-2.5 py-0.5 bg-brand-500/20 border border-brand-500/30 rounded-md text-[10px] font-bold text-brand-300 mb-2 uppercase tracking-wide">
                        {video.category_name}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-2 group-hover:text-brand-200 transition-colors">
                      {video.title}
                    </h3>
                    {video.uploader_name && (
                      <p className="text-xs text-gray-400 mb-1.5">{video.uploader_name}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-300">
                      <span className="flex items-center gap-1"><Eye size={12} /> {formatViews(video.views)}</span>
                      <span className="flex items-center gap-1"><Heart size={12} /> {video.likes}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(video.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Grid — Remaining Videos */}
          {gridVideos.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {gridVideos.map((video) => (
                <motion.div key={video.id} variants={itemVariants}>
                  <div
                    onClick={() => handleVideoClick(video)}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-500/30 dark:hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/5"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-video overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Premium Badge */}
                      {video.isPremium && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-gold-500 to-amber-400 rounded-md shadow-lg shadow-gold-500/30 z-10">
                          <Crown size={10} className="text-white" />
                          <span className="text-[9px] font-bold text-white uppercase">Premium</span>
                        </div>
                      )}
                      {/* Duration */}
                      {video.duration > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 bg-brand-500/80 rounded-full flex items-center justify-center">
                            {user ? (
                              <Play size={18} className="text-white fill-white ml-0.5" />
                            ) : (
                              <Lock size={16} className="text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {video.title}
                      </h3>
                      {video.uploader_name && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 truncate">{video.uploader_name}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1"><Eye size={11} /> {formatViews(video.views)}</span>
                        <span>{timeAgo(video.created_at)}</span>
                      </div>
                      {video.category_name && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-brand-500/10 dark:bg-brand-500/15 rounded text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                          {video.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
            >
              {/* Video Preview */}
              {selectedVideo && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={selectedVideo.thumbnail_url}
                    alt={selectedVideo.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => setShowLoginPrompt(false)}
                      className="p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <Lock size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 text-center">
                {selectedVideo && (
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {selectedVideo.title}
                  </h3>
                )}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 rounded-full mb-4">
                  <Lock size={14} className="text-gold-500" />
                  <span className="text-xs font-medium text-gold-600 dark:text-gold-400">Contenu réservé aux membres</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Connectez-vous ou créez un compte pour accéder à toutes les vidéos de Sidra TV
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/login"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-500 to-brand-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow"
                  >
                    <LogIn size={16} />
                    Se Connecter
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Créer un Compte
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
