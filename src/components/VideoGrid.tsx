'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  if (loading) {
    return (
      <section className="py-12 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {title && <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-8">{title}</h2>}
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 dark:text-white mb-2">{title}</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-brand-500 to-islamic-teal rounded-full" />
          </motion.div>
        )}

        {featured ? (
          // Featured slider layout
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
          // Regular grid layout
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
            <p className="text-gray-600 dark:text-gray-400 text-lg">No videos found</p>
          </div>
        )}
      </div>
    </section>
  );
}
