'use client';

import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Volume2, VolumeX, ExternalLink, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubePlayerModal } from './YouTubePlayerModal';

interface YouTubeVideo {
  id: string;
  title: string;
  image: string;
  description?: string;
}

interface SponsoredBanner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  media_type: string;
  autoplay: boolean;
  link_url: string;
  banner_type: string;
  priority: number;
}

type CarouselItem =
  | { type: 'youtube'; data: YouTubeVideo }
  | { type: 'banner'; data: SponsoredBanner };

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface YouTubeFeaturedCarouselProps {
  query: string;
  maxResults?: number;
}

export function YouTubeFeaturedCarousel({ query, maxResults = 5 }: YouTubeFeaturedCarouselProps) {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch both YouTube videos and sponsored banners
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [videosRes, bannersRes] = await Promise.all([
          fetch(`/api/videos?q=${encodeURIComponent(query)}&max=${maxResults}`, { cache: 'no-store' }).catch(() => null),
          fetch('/api/banners').catch(() => null),
        ]);

        const youtubeVideos: YouTubeVideo[] = videosRes?.ok
          ? await videosRes.json().then((d: any) => (Array.isArray(d) ? d : []))
          : [];
        const banners: SponsoredBanner[] = bannersRes?.ok
          ? await bannersRes.json().then((d: any) => d.banners || [])
          : [];

        // Build mixed list: sponsored banners first (by priority), then YouTube videos
        const carouselItems: CarouselItem[] = [
          ...banners.map((b) => ({ type: 'banner' as const, data: b })),
          ...youtubeVideos.map((v) => ({ type: 'youtube' as const, data: v })),
        ];

        setItems(carouselItems);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [query, maxResults]);

  // Auto-rotate every 7 seconds (pause on banner video with autoplay)
  useEffect(() => {
    if (items.length <= 1) return;
    const current = items[currentIndex];
    const isAutoplayVideo = current?.type === 'banner' && current.data.media_type === 'video' && current.data.autoplay;
    const delay = isAutoplayVideo ? 15000 : 7000;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, delay);

    return () => clearInterval(interval);
  }, [items, currentIndex]);

  // Handle video autoplay when slide changes
  useEffect(() => {
    if (!videoRef.current) return;
    const current = items[currentIndex];
    if (current?.type === 'banner' && current.data.media_type === 'video' && current.data.autoplay) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, items]);

  const handleBannerClick = useCallback((banner: SponsoredBanner) => {
    // Track click via API (fire and forget)
    fetch(`/api/banners?action=click&id=${banner.id}`, { method: 'POST' }).catch(() => {});

    if (banner.media_type === 'video' && banner.video_url) {
      const ytId = extractYouTubeId(banner.video_url);
      if (ytId) {
        setSelectedVideoId(ytId);
        return;
      }
      // For non-YouTube videos, if there's a link, open it
      if (banner.link_url) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      }
    } else if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  if (loading) {
    return (
      <div className="h-64 md:h-80 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-64 md:h-80 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200/50 dark:border-gray-800/50">
        <p className="text-gray-400">No videos available</p>
      </div>
    );
  }

  const current = items[currentIndex];

  const renderBanner = (banner: SponsoredBanner) => {
    const isVideo = banner.media_type === 'video' && banner.video_url;
    const ytId = isVideo ? extractYouTubeId(banner.video_url) : null;

    return (
      <>
        {/* Background Media */}
        {isVideo && ytId && banner.autoplay ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ border: 0 }}
          />
        ) : isVideo && !ytId && banner.autoplay ? (
          <video
            ref={videoRef}
            src={banner.video_url}
            muted={muted}
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : banner.image_url ? (
          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
        ) : isVideo && ytId ? (
          <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900 to-slate-900" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

        {/* Sponsored Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 backdrop-blur-md border border-brand-500/30 rounded-full">
          <Sparkles size={12} className="text-brand-400" />
          <span className="text-[11px] font-bold text-brand-300">Sponsorisé</span>
        </div>

        {/* Mute toggle for autoplay video */}
        {isVideo && banner.autoplay && (
          <button
            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            className="absolute top-4 right-16 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-[1]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 max-w-2xl"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white">{banner.title}</h1>
            {banner.description && (
              <p className="text-gray-300 text-base md:text-lg line-clamp-2">{banner.description}</p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 pt-2"
            >
              {isVideo && !banner.autoplay && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBannerClick(banner)}
                  className="flex items-center gap-2 px-7 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all shadow-lg"
                >
                  <Play size={22} fill="currentColor" />
                  <span>Regarder</span>
                </motion.button>
              )}
              {banner.link_url && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBannerClick(banner)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold transition-all border border-white/20"
                >
                  <ExternalLink size={18} />
                  <span>En savoir plus</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  };

  const renderYouTube = (video: YouTubeVideo) => (
    <>
      <img src={video.image} alt={video.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white">{video.title}</h1>
          {video.description && (
            <p className="text-gray-300 text-lg line-clamp-3">{video.description}</p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedVideoId(video.id)}
              className="flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all shadow-lg"
            >
              <Play size={24} fill="currentColor" />
              <span>Watch Now</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );

  const selectedTitle = current.type === 'youtube' ? current.data.title : current.data.title;
  const selectedDesc = current.type === 'youtube' ? current.data.description : current.data.description;

  return (
    <>
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-black group shadow-xl shadow-black/20 border border-white/5"
      >
        {current.type === 'banner' ? renderBanner(current.data) : renderYouTube(current.data)}

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={24} />
            </motion.button>

            {/* Progress Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {items.map((item, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? item.type === 'banner' ? 'w-8 bg-brand-400' : 'w-8 bg-brand-500'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              {currentIndex + 1} / {items.length}
            </div>
          </>
        )}
      </motion.div>

      {/* Video Player Modal */}
      {selectedVideoId && (
        <YouTubePlayerModal
          videoId={selectedVideoId}
          title={selectedTitle}
          description={selectedDesc}
          isOpen={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </>
  );
}
