'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { YouTubePlayerModal } from './YouTubePlayerModal';

interface YouTubeVideo {
  id: string;
  title: string;
  image: string;
  description?: string;
}

interface YouTubeFeaturedCarouselProps {
  query: string;
  maxResults?: number;
}

export function YouTubeFeaturedCarousel({ query, maxResults = 5 }: YouTubeFeaturedCarouselProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos?q=${encodeURIComponent(query)}&max=${maxResults}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch videos');
        const data = await response.json();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query, maxResults]);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    if (videos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [videos.length]);

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200/50 dark:border-gray-800/50">
        <p className="text-gray-400">No videos available</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <>
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-96 rounded-2xl overflow-hidden bg-black group shadow-xl shadow-black/20 border border-white/5"
      >
        {/* Background Image */}
        <img
          src={currentVideo.image}
          alt={currentVideo.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white">{currentVideo.title}</h1>
            {currentVideo.description && (
              <p className="text-gray-300 text-lg line-clamp-3">{currentVideo.description}</p>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedVideoId(currentVideo.id)}
                className="flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all shadow-lg"
              >
                <Play size={24} fill="currentColor" />
                <span>Watch Now</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        {videos.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex((prev) => (prev + 1) % videos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={24} />
            </motion.button>

            {/* Progress Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {videos.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-brand-500' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              {currentIndex + 1} / {videos.length}
            </div>
          </>
        )}
      </motion.div>

      {/* Video Player Modal */}
      {selectedVideoId && (
        <YouTubePlayerModal
          videoId={selectedVideoId}
          title={currentVideo.title}
          description={currentVideo.description}
          isOpen={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </>
  );
}
