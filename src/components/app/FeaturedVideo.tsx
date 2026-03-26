'use client';

import { motion } from 'framer-motion';
import { Play, Heart, Share2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';

interface FeaturedVideoItem {
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  videoId: string;
}

interface FeaturedVideoProps {
  items?: FeaturedVideoItem[];
  title?: string;
  description?: string;
  image?: string;
  category?: string;
  rating?: number;
  videoId?: string;
}

export function FeaturedVideo({
  items = [],
  title,
  description,
  image = '',
  category = '',
  rating = 0,
  videoId = '',
}: FeaturedVideoProps) {
  // Check if we have any videos content before calling hooks
  const hasContent = items.length > 0 || !!title;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Memoize videos to avoid reference changes triggering useEffect
  const videos = useMemo(() => {
    if (items.length > 0) return items;
    if (title) {
      return [{
        title,
        description: description || '',
        image: image || '',
        category: category || '',
        rating: rating || 0,
        videoId: videoId || '',
      }];
    }
    return [];
  }, [items, title, description, image, category, rating, videoId]);
  
  // Auto-scroll every 7 seconds
  useEffect(() => {
    if (videos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [videos.length]);

  if (!hasContent) return null;
  
  const currentVideo = videos[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden"
    >
      {/* Background Image with Key for animation on change */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        <Image
          src={currentVideo.image}
          alt={currentVideo.title}
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-gray-950 via-white/50 dark:via-gray-950/50 to-transparent dark:to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Category & Rating */}
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-brand-500/80 text-white text-xs font-bold rounded-full">
              {currentVideo.category}
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400 text-sm">⭐ {currentVideo.rating}/10</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-950 dark:text-white max-w-2xl">{currentVideo.title}</h1>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base max-w-xl line-clamp-2">
            {currentVideo.description}
          </p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-all"
            >
              <Play size={20} fill="currentColor" />
              <span>Play</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
            >
              <Info size={20} />
              <span>More Info</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-gray-800 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Heart size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Share2 size={20} />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Navigation Arrows - Only show if multiple videos */}
      {videos.length > 1 && (
        <>
          {/* Left Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </motion.button>

          {/* Right Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
          >
            <ChevronRight size={24} />
          </motion.button>

          {/* Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2">
            {videos.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-8 bg-brand-500'
                    : 'w-2 bg-white/50 hover:bg-white/75'
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
  );
}
