'use client';

import { motion } from 'framer-motion';
import { Play, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { SimpleVideoPlayerModal } from './SimpleVideoPlayerModal';

interface ContentCardProps {
  id: string;
  title: string;
  image: string;
  duration?: string;
  category?: string;
  rating?: number;
  type?: 'horizontal' | 'vertical';
  videoId?: string; // For YouTube videos
}

export function ContentCard({
  id,
  title,
  image,
  duration,
  category,
  rating,
  type = 'vertical',
  videoId,
}: ContentCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const isHorizontal = type === 'horizontal';
  const isYouTubeVideo = !!videoId;

  const CardContent = (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      className={`group relative overflow-hidden rounded-lg cursor-pointer ${
        isHorizontal ? 'aspect-video' : 'aspect-[2/3]'
      }`}
    >
      {/* Image - use img for YouTube, Image for optimized local */}
      {isYouTubeVideo ? (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 dark:from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      {/* Center Play Button - Always visible for YouTube videos */}
      {isYouTubeVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPlayer(true)}
            className="p-4 bg-purple-600/90 hover:bg-purple-700 text-white rounded-full shadow-lg backdrop-blur-sm transition-all"
          >
            <Play size={28} fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 dark:from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      {/* Category Badge */}
      {category && !isHorizontal && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-500/80 text-white rounded">
            {category}
          </span>
        </div>
      )}

      {/* Content Info */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div>
          <h3 className="font-bold text-sm text-white mb-2 line-clamp-2">{title}</h3>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isYouTubeVideo) {
                    setShowPlayer(true);
                  }
                }}
              >
                <Play size={16} fill="currentColor" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Heart size={16} />
              </motion.button>
            </div>

            {duration && (
              <span className="text-xs bg-gray-950/80 dark:bg-gray-950/80 text-white px-2 py-1 rounded">
                {duration}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {isYouTubeVideo ? (
        <div onClick={() => setShowPlayer(true)}>
          {CardContent}
        </div>
      ) : (
        <Link href={`/watch/${id}`}>
          {CardContent}
        </Link>
      )}

      {isYouTubeVideo && videoId && (
        <SimpleVideoPlayerModal
          videoId={videoId}
          title={title}
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}
