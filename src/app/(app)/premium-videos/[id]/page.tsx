'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Calendar,
  Tag,
  Crown,
  Sparkles,
  ThumbsUp,
  Share2,
  Lock,
} from 'lucide-react';
import { PremiumVideoPlayer } from '@/components/premium/PremiumVideoPlayer';
import { premiumVideoService } from '@/services/premiumVideos';
import { premiumService } from '@/services/premium';
import type { PremiumVideoWithRelations } from '@/types/premium';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function WatchPremiumVideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [video, setVideo] = useState<PremiumVideoWithRelations | null>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [quality, setQuality] = useState('720p');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const fetchVideo = useCallback(
    async (q: string) => {
      const data = await premiumVideoService.getVideo(id, q);
      if (!data) {
        setError('Video not found');
        setLoading(false);
        return;
      }
      setVideo(data.video);
      setStreamUrl(data.stream_url);
      setQuality(data.quality);
      setAvailableQualities(data.available_qualities);
      setLoading(false);
    },
    [id],
  );

  useEffect(() => {
    const status = premiumService.getPremiumStatus();
    setIsPremiumUser(status.isActive);
    if (!status.isActive) {
      setLoading(false);
      return;
    }
    fetchVideo(quality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleQualityChange = (newQuality: string) => {
    setLoading(true);
    fetchVideo(newQuality);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Non-premium gating
  if (!loading && !isPremiumUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="p-4 rounded-2xl bg-gold-500/10 mx-auto w-fit">
            <Lock size={40} className="text-gold-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Premium Content</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Subscribe to a premium plan to access this exclusive content.
          </p>
          <Link href="/premium">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-white font-semibold rounded-xl shadow-lg shadow-gold-500/30 mt-2"
            >
              <Crown size={16} className="inline mr-2 -mt-0.5" />
              Upgrade Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading premium video...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-6">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-lg font-semibold">{error || 'Video not found'}</p>
          <button
            onClick={() => router.push('/premium-videos')}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm"
          >
            Back to videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Video Player */}
      <div className="w-full bg-black">
        <div className="max-w-6xl mx-auto">
          <PremiumVideoPlayer
            streamUrl={streamUrl}
            title={video.title}
            quality={quality}
            availableQualities={availableQualities}
            onQualityChange={handleQualityChange}
            onBack={() => router.push('/premium-videos')}
          />
        </div>
      </div>

      {/* Video Info */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6"
      >
        {/* Back Link */}
        <motion.div variants={fadeUp}>
          <Link
            href="/premium-videos"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gold-500 dark:hover:text-gold-400 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Premium Videos
          </Link>
        </motion.div>

        {/* Title & Meta */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex-1">
              {video.title}
            </h1>
            {video.min_plan && (
              <span
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold uppercase text-white ${
                  video.min_plan === 'vip'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : video.min_plan === 'premium'
                    ? 'bg-gradient-to-r from-gold-500 to-gold-400'
                    : 'bg-gradient-to-r from-brand-500 to-brand-400'
                }`}
              >
                {video.min_plan}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Eye size={14} />
              {(video.views || 0).toLocaleString()} views
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(video.created_at)}
            </span>
            {video.categories?.name && (
              <span className="flex items-center gap-1.5">
                <Tag size={14} />
                {video.categories.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-gold-500">
              <Sparkles size={14} />
              {quality}
            </span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-all">
            <ThumbsUp size={15} />
            {(video.likes || 0).toLocaleString()}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: video.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-all"
          >
            <Share2 size={15} />
            Share
          </button>
        </motion.div>

        {/* Description */}
        {video.description && (
          <motion.div
            variants={fadeUp}
            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800"
          >
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {video.description}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
