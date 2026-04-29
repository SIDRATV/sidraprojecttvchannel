'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, X, BookOpen, Briefcase, TrendingUp, Cpu, Users, Tv, Eye } from 'lucide-react';
import { YouTubePlayerModal } from './YouTubePlayerModal';

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
  channelTitle?: string;
  description?: string;
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
  maxResults = 6,
  type = 'vertical',
  icon,
}: YouTubeSectionProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const Icon = icon ? iconMap[icon] || iconMap.default : null;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos?q=${encodeURIComponent(query)}&max=${maxResults}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-3 rounded-2xl bg-gray-100 dark:bg-gray-900/50 animate-pulse">
              <div className="flex-shrink-0 w-48 md:w-64 aspect-video rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || videos.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader />
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 rounded-xl text-sm">
          {error ? `Erreur: ${error}` : `Aucune vidéo trouvée pour "${query}"`}
        </div>
      </section>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <SectionHeader />

        {/* Video list — 1 per row, 16:9 thumbnail */}
        <div className="space-y-3">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setSelectedVideo(video)}
              className="group flex gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800/60 hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:bg-white dark:hover:bg-gray-900/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* Thumbnail 16:9 */}
              <div className="relative flex-shrink-0 w-44 md:w-60 lg:w-72 aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img
                  src={video.image}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="p-2.5 bg-brand-500/90 rounded-full shadow-lg">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
                {/* Duration badge */}
                {video.duration && (
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
                    {video.duration}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-semibold text-gray-950 dark:text-white text-sm md:text-base line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {video.title}
                  </h3>

                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {video.views && (
                    <span className="flex items-center gap-1">
                      <Eye size={11} />
                      {video.views}
                    </span>
                  )}
                  {video.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {video.publishedAt}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1.5 text-brand-500 dark:text-brand-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={11} fill="currentColor" />
                    Regarder
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* YouTube Player Modal */}
      {selectedVideo && (
        <YouTubePlayerModal
          videoId={selectedVideo.id}
          title={selectedVideo.title}
          description={selectedVideo.description}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

