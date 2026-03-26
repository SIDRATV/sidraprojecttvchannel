'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { YouTubeFeaturedCarousel } from '@/components/app/YouTubeFeaturedCarousel';
import { YouTubeSection } from '@/components/app/YouTubeSection';
import { LazySection } from '@/components/app/LazySection';
import { PremiumBanner, PremiumContentPreview } from '@/components/premium';
import { Heart, MessageCircle, Play, Sparkles, TrendingUp, BookOpen, Briefcase, Cpu, Users } from 'lucide-react';
import { videoService } from '@/services/videos';
import type { VideoWithRelations } from '@/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function SectionHeader({ icon: Icon, title, description, gold = false }: { icon: React.ElementType; title: string; description: string; gold?: boolean }) {
  return (
    <motion.div variants={fadeInUp} className="flex items-start gap-3">
      <div className={`mt-1 p-2 rounded-xl ${gold ? 'bg-gradient-to-br from-gold-500 to-gold-400 shadow-glow-gold' : 'bg-gradient-to-br from-brand-500 to-brand-400 shadow-glow'}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h2 className={`text-2xl md:text-3xl font-bold ${gold ? 'bg-gradient-to-r from-gold-400 via-gold-500 to-gold-300 bg-clip-text text-transparent' : 'text-gray-950 dark:text-white'}`}>
          {title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [recentVideos, setRecentVideos] = useState<VideoWithRelations[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoWithRelations[]>([]);

  useEffect(() => {
    videoService.getVideos(6).then(setRecentVideos).catch(() => {});
    videoService.getFeaturedVideos(5).then(setFeaturedVideos).catch(() => {});
  }, []);

  const premiumContent = featuredVideos.map(v => ({
    id: v.id,
    title: v.title,
    image: v.thumbnail_url || 'https://images.unsplash.com/photo-1618761490192-04901461159e?w=500&h=300&fit=crop',
    category: (v as any).categories?.name || 'Premium',
  }));

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 transition-colors overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-gold-500/5 dark:bg-gold-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-[350px] w-[350px] rounded-full bg-brand-400/5 dark:bg-brand-400/8 blur-3xl" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-10 p-4 md:p-8 lg:p-10"
      >
        {/* Premium Banner */}
        <motion.div variants={fadeInUp}>
          <PremiumBanner />
        </motion.div>

        {/* Featured Carousel */}
        <motion.div variants={fadeInUp}>
          <YouTubeFeaturedCarousel
            query="technology innovation trending"
            maxResults={5}
          />
        </motion.div>

        {/* Latest Videos Section */}
        {recentVideos.length > 0 && (
          <motion.section variants={fadeInUp} className="space-y-5">
            <SectionHeader icon={Sparkles} title="Latest Videos" description="Recently added to the platform" gold />
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-5 pb-4">
                {recentVideos.map((video, idx) => (
                  <Link key={video.id} href={`/watch/${video.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="flex-shrink-0 w-80 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800/60 hover:border-gold-400/50 dark:hover:border-gold-500/40 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-gold-500/10"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${video.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop'})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <div className="p-3 bg-brand-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-brand-500/30">
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                            {Math.floor(video.duration / 60)}m
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 bg-gold-500/10 dark:bg-gold-500/15 text-gold-600 dark:text-gold-400 text-xs font-semibold rounded-lg border border-gold-500/20">
                            {(video as any).categories?.name || 'Video'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-950 dark:text-white mb-2 line-clamp-2 text-sm leading-snug">
                          {video.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 hover:text-red-400 transition-colors">
                              <Heart size={13} />
                              {video.likes ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={13} />
                              {(video as any).comments_count ?? 0}
                            </span>
                          </div>
                          <span className="text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{(video as any).users?.full_name || ''}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Exclusive / Premium Content */}
        <motion.section variants={fadeInUp} className="space-y-5">
          <SectionHeader icon={Sparkles} title="Exclusive Content" description="Premium documentaries and masterclasses" gold />
          <PremiumContentPreview content={premiumContent} />
        </motion.section>

        {/* Divider */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
          <Sparkles size={14} className="text-gold-500/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        </motion.div>

        {/* Educational Videos */}
        <motion.div variants={fadeInUp}>
          <LazySection>
            <YouTubeSection
              title="Educational Content"
              description="Learn new skills and concepts"
              query="education tutorial learning"
              maxResults={12}
              icon="book"
            />
          </LazySection>
        </motion.div>

        {/* Business & Entrepreneurship */}
        <motion.div variants={fadeInUp}>
          <LazySection>
            <YouTubeSection
              title="Business & Entrepreneurship"
              description="Insights for founders and business leaders"
              query="startup business entrepreneurship investor"
              maxResults={12}
              icon="briefcase"
            />
          </LazySection>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
          <div className="h-1.5 w-1.5 rounded-full bg-brand-500/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        </motion.div>

        {/* Trending Now */}
        <motion.div variants={fadeInUp}>
          <LazySection>
            <YouTubeSection
              title="Trending Now"
              description="What's popular this week"
              query="trending viral"
              maxResults={12}
              icon="trending"
            />
          </LazySection>
        </motion.div>

        {/* Technology Deep Dives */}
        <motion.div variants={fadeInUp}>
          <LazySection>
            <YouTubeSection
              title="Technology Deep Dives"
              description="In-depth explorations of tech topics"
              query="blockchain cryptocurrency AI machine learning"
              maxResults={12}
              icon="cpu"
            />
          </LazySection>
        </motion.div>

        {/* Community & Culture */}
        <motion.div variants={fadeInUp}>
          <LazySection>
            <YouTubeSection
              title="Community & Culture"
              description="Stories that inspire and unite"
              query="community culture inspiration"
              maxResults={8}
              icon="users"
            />
          </LazySection>
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}
