'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Eye, Heart } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { formatViewCount, truncateText } from '@/lib/utils';
import type { VideoWithRelations } from '@/types';

interface VideoCardProps {
  video: VideoWithRelations;
  featured?: boolean;
}

export function VideoCard({ video, featured = false }: VideoCardProps) {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (featured) {
    return (
      <Link href={`/video/${video.id}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative w-full h-80 rounded-2xl overflow-hidden group cursor-pointer"
        >
          {/* Thumbnail */}
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 dark:from-gray-950 via-gray-950/20 dark:via-gray-950/20 to-transparent" />

          {/* Play Button */}
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 bg-brand-500/30 backdrop-blur-md rounded-full flex items-center justify-center border border-brand-500/50 group-hover:bg-brand-500/50 transition-all">
              <Play size={32} className="text-white fill-white ml-1" />
            </div>
          </motion.div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="mb-3">Featured</Badge>
            <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{video.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200 dark:text-gray-400">{formatViewCount(video.views)}</span>
              <span className="text-sm text-islamic-gold font-semibold capitalize">{video.video_type}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/video/${video.id}`}>
      <Card hover className="h-full flex flex-col overflow-hidden p-0">
        <div className="relative w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-800 group">
          {/* Thumbnail */}
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Duration */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-sm text-white">
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center">
                <Play size={24} className="text-white fill-white ml-0.5" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          {/* Title and Description */}
          <div>
            <h3 className="font-bold text-gray-950 dark:text-white mb-2 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400">
              {video.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {truncateText(video.description, 100)}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-800 space-y-3 transition-colors">
            {/* Category */}
            {video.categories && (
              <Badge variant="success" className="inline-block">
                {video.categories.name}
              </Badge>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{formatViewCount(video.views)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  <span>{video.likes}</span>
                </div>
              </div>
              <span className="text-islamic-gold capitalize text-xs font-semibold">
                {video.video_type}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
