'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { BookOpen, Briefcase, TrendingUp, Cpu, Users, Tv } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen,
  briefcase: Briefcase,
  trending: TrendingUp,
  cpu: Cpu,
  users: Users,
  default: Tv,
};

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
  icon?: string;
}

export function YouTubeSection({
  title,
  description,
  query,
  maxResults = 12,
  type = 'vertical',
  icon,
}: YouTubeSectionProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const Icon = icon ? iconMap[icon] || iconMap.default : null;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        console.log(`Fetching videos for query: ${query}`);
        const response = await fetch(`/api/videos?q=${encodeURIComponent(query)}&max=${maxResults}`, { cache: 'no-store' });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} videos`);
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Video fetch error:', message);
        setError(message);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query, maxResults]);

  const SectionHeader = () => (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20">
          <Icon size={18} className="text-white" />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-0.5">{title}</h2>
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionHeader />
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500/30 border-t-brand-500" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <SectionHeader />
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl">
          <p className="font-semibold mb-2">Error loading videos:</p>
          <code className="block text-xs bg-black/20 p-2 rounded mb-2 overflow-auto">{error}</code>
          <p className="text-sm">
            Make sure <code className="bg-black/20 px-1 rounded">YOUTUBE_API_KEY</code> is set in <code className="bg-black/20 px-1 rounded">.env.local</code>
          </p>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader />
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
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <SectionHeader />

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
            transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
