'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentCard } from './ContentCard';

interface YouTubeVideo {
  id: string;
  title: string;
  image: string;
  duration?: string;
  url?: string;
  views?: string;
  publishedAt?: string;
}

interface YouTubeSectionProps {
  title: string;
  description?: string;
  query: string;
  maxResults?: number;
  type?: 'vertical' | 'horizontal';
}

export function YouTubeSection({
  title,
  description,
  query,
  maxResults = 12,
  type = 'vertical',
}: YouTubeSectionProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos?q=${encodeURIComponent(query)}&max=${maxResults}`);
        if (!response.ok) throw new Error('Failed to fetch videos');
        const data = await response.json();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query, maxResults]);

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{title}</h2>
          {description && <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>}
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{title}</h2>
          {description && <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>}
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
          Error loading videos: {error}
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{title}</h2>
          {description && <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>}
        </div>
        <div className="p-4 text-gray-600 dark:text-gray-400 rounded-lg">
          No videos found for &quot;{query}&quot;
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{title}</h2>
        {description && <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>}
      </div>

      <div
        className={`grid gap-4 ${
          type === 'horizontal'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ContentCard
              id={video.id}
              videoId={video.id}
              title={video.title}
              image={video.image}
              duration={video.duration}
              type={type}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
