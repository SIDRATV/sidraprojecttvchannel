'use client';

import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Volume2, VolumeX, ExternalLink, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubePlayerModal } from './YouTubePlayerModal';

interface SponsoredBanner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  media_type: string;
  autoplay: boolean;
  display_duration: number;
  link_url: string;
  banner_type: string;
  priority: number;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function YouTubeFeaturedCarousel() {
  const [banners, setBanners] = useState<SponsoredBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch sponsored banners only
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        setBanners(data.banners || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotate using per-banner display_duration (in seconds)
  useEffect(() => {
    if (banners.length <= 1) return;
    const current = banners[currentIndex];
    const durationMs = (current?.display_duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [banners, currentIndex]);

  // Handle video autoplay when slide changes
  useEffect(() => {
    if (!videoRef.current) return;
    const current = banners[currentIndex];
    if (current?.media_type === 'video' && current.autoplay) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, banners]);

  const handleBannerClick = useCallback((banner: SponsoredBanner) => {
    fetch(`/api/banners?action=click&id=${banner.id}`, { method: 'POST' }).catch(() => {});

    if (banner.media_type === 'video' && banner.video_url) {
      const ytId = extractYouTubeId(banner.video_url);
      if (ytId) {
        setSelectedVideoId(ytId);
        return;
      }
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

  if (banners.length === 0) {
    return null;
  }

  const current = banners[currentIndex];

  const renderBanner = (banner: SponsoredBanner) => {
    const isVideo = banner.media_type === 'video' && banner.video_url;
    const ytId = isVideo ? extractYouTubeId(banner.video_url) : null;
    // Determine thumbnail: explicit image_url, or auto-generated YouTube thumbnail
    const thumbnail = banner.image_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');

    return (
      <>
        {/* Thumbnail layer — always visible as background/poster */}
        {thumbnail ? (
          <img src={thumbnail} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-brand-900 to-slate-900" />
        )}

        {/* Video layer — only for autoplay videos, overlays the thumbnail */}
        {isVideo && banner.autoplay && ytId && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[1]"
            style={{ border: 0 }}
          />
        )}
        {isVideo && banner.autoplay && !ytId && (
          <video
            ref={videoRef}
            src={banner.video_url}
            poster={thumbnail}
            muted={muted}
            autoPlay
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-[1]"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-[2]" />

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
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-[3]">
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

  return (
    <>
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-black group shadow-xl shadow-black/20 border border-white/5"
      >
        {renderBanner(current)}

        {/* Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={24} />
            </motion.button>

            {/* Progress Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {banners.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-brand-400' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              {currentIndex + 1} / {banners.length}
            </div>
          </>
        )}
      </motion.div>

      {/* Video Player Modal */}
      {selectedVideoId && (
        <YouTubePlayerModal
          videoId={selectedVideoId}
          title={current.title}
          description={current.description}
          isOpen={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </>
  );
}
