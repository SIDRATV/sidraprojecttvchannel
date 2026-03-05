'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Share2, Heart } from 'lucide-react';
import Link from 'next/link';
import { videoService } from '@/services/videos';
import type { Video } from '@/types';

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const data = await videoService.getVideoById(videoId);
        setVideo(data);
      } catch (err) {
        setError('Failed to load video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-600">{error || 'Video not found'}</div>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-950 min-h-screen"
    >
      {/* Video Player */}
      <div className="relative bg-black aspect-video w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Play className="w-16 h-16 text-white mx-auto mb-4" />
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
      </div>

      {/* Video Info */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">
            {video.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 capitalize">
            {video.video_type}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Heart size={20} />
            Add to Watchlist
          </button>
          <button className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-950 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <Share2 size={20} />
            Share
          </button>
        </div>

        {/* Description */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="text-xl font-semibold text-gray-950 dark:text-white mb-4">
            About This Video
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            This is a featured Islamic educational content. Enjoy learning!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
