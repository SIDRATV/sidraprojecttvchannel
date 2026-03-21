'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { YouTubeFeaturedCarousel } from '@/components/app/YouTubeFeaturedCarousel';
import { YouTubeSection } from '@/components/app/YouTubeSection';
import { PremiumBanner, PremiumContentPreview } from '@/components/premium';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { videoService } from '@/services/videos';
import type { VideoWithRelations } from '@/types';

export default function DashboardPage() {
  const [recentVideos, setRecentVideos] = useState<VideoWithRelations[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoWithRelations[]>([]);

  useEffect(() => {
    videoService.getVideos(6).then(setRecentVideos).catch(() => {});
    videoService.getFeaturedVideos(5).then(setFeaturedVideos).catch(() => {});
  }, []);

  // Map real videos to the format PremiumContentPreview expects
  const premiumContent = featuredVideos.map(v => ({
    id: v.id,
    title: v.title,
    image: v.thumbnail_url || 'https://images.unsplash.com/photo-1618761490192-04901461159e?w=500&h=300&fit=crop',
    category: (v as any).categories?.name || 'Premium',
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors"
    >
      {/* Premium Banner - Shows if user has unlocked a plan */}
      <PremiumBanner />

      {/* Featured Videos from YouTube API - Auto-rotates every 7 seconds */}
      <YouTubeFeaturedCarousel
        query="technology innovation trending"
        maxResults={5}
      />

      {/* Latest Videos Section - Real data from Supabase */}
      {recentVideos.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Latest Videos</h2>
            <p className="text-gray-600 dark:text-gray-400">Recently added to the platform</p>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4">
              {recentVideos.map((video) => (
                <Link key={video.id} href={`/watch/${video.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="flex-shrink-0 w-80 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${video.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop'})` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" fill="white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                          {(video as any).categories?.name || 'Video'}
                        </span>
                        <span className="text-xs text-gray-500">{video.duration ? `${Math.floor(video.duration / 60)}m` : ''}</span>
                      </div>
                      <h3 className="font-bold text-gray-950 dark:text-white mb-2 line-clamp-2 text-sm">
                        {video.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Heart size={14} />
                            {video.likes ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            {(video as any).comments_count ?? 0}
                          </span>
                        </div>
                        <span>{(video as any).users?.full_name || ''}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Premium Content Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Exclusive Content</h2>
          <p className="text-gray-600 dark:text-gray-400">Scroll to discover premium documentaries and masterclasses</p>
        </div>
        <PremiumContentPreview content={premiumContent} />
      </section>

      {/* Educational Videos */}
      <YouTubeSection
        title="Educational Content"
        description="Learn new skills and concepts"
        query="education tutorial learning"
        maxResults={12}
      />

      {/* Business & Entrepreneurship */}
      <YouTubeSection
        title="Business & Entrepreneurship"
        description="Insights for founders and business leaders"
        query="startup business entrepreneurship investor"
        maxResults={12}
      />

      {/* Trending Now */}
      <YouTubeSection
        title="Trending Now"
        description="What's popular this week"
        query="trending viral"
        maxResults={12}
      />

      {/* Technology Deep Dives */}
      <YouTubeSection
        title="Technology Deep Dives"
        description="In-depth explorations of tech topics"
        query="blockchain cryptocurrency AI machine learning"
        maxResults={12}
      />

      {/* Community & Culture */}
      <YouTubeSection
        title="Community & Culture"
        description="Stories that inspire and unite"
        query="community culture inspiration"
        maxResults={8}
      />
    </motion.div>
  );
}
