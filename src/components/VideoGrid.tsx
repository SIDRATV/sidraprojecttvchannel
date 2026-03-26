'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Star } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { videoService } from '@/services/videos';
import type { Video } from '@/types';

interface VideoGridProps {
  title?: string;
  featured?: boolean;
  limit?: number;
  category?: string;
}

export function VideoGrid({ title, featured = false, limit = 12, category }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        let data;

        if (featured) {
          data = await videoService.getFeaturedVideos(limit);
        } else if (category) {
          data = await videoService.getVideosByCategory(category, limit);
        } else {
          data = await videoService.getVideos(limit);
        }

        setVideos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [featured, limit, category]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const Icon = featured ? Star : TrendingUp;

  if (loading) {
    return (
      <section className="py-14 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {title && (
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400">
                <Icon size={18} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">{title}</h2>
            </div>
          )}
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500/30 border-t-brand-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={featured ? 'trending' : undefined} className="py-14 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${featured ? 'from-gold-500 to-gold-400 shadow-lg shadow-gold-500/20' : 'from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20'}`}>
                <Icon size={18} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">{title}</h2>
            </div>
            <div className={`h-1 w-20 rounded-full ml-[52px] ${featured ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`} />
          </motion.div>
        )}

        {featured ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {videos.map((video) => (
              <motion.div key={video.id} variants={itemVariants}>
                <VideoCard video={video} featured={true} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {videos.map((video) => (
              <motion.div key={video.id} variants={itemVariants}>
                <VideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No videos found</p>
          </div>
        )}
      </div>
    </section>
  );
}
