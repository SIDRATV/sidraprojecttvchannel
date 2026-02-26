'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Eye, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { VideoGrid } from '@/components/VideoGrid';
import { useAuth } from '@/hooks/useAuth';
import { videoService } from '@/services/videos';
import { commentService } from '@/services/comments';
import { formatDate, formatViewCount } from '@/lib/utils';
import type { VideoWithRelations } from '@/types';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoWithRelations | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const data = await videoService.getVideoById(videoId);
        setVideo(data);

        // Increment views
        await videoService.incrementViews(videoId);

        // Fetch comments
        const videoComments = await commentService.getVideoComments(videoId);
        setComments(videoComments);
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    setCommenting(true);
    try {
      const newComment = await commentService.addComment(videoId, user.id, comment);
      setComments([newComment, ...comments]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Video not found</h1>
          <p className="text-gray-400">The video you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full bg-black rounded-2xl overflow-hidden aspect-video mb-8"
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.video_url}?autoplay=1`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              {/* Title */}
              <h1 className="text-4xl font-bold mb-4">{video.title}</h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-gray-400" />
                  <span className="text-gray-400">{formatViewCount(video.views)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" />
                  <span className="text-gray-400">{formatDate(video.created_at)}</span>
                </div>
                {video.categories && (
                  <Badge variant="success">{video.categories.name}</Badge>
                )}
                <Badge variant="default">{video.video_type}</Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    liked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                  <span>{video.likes + (liked ? 1 : 0)}</span>
                </motion.button>

                <Button variant="secondary">
                  <MessageCircle size={20} />
                  <span>{comments.length}</span>
                </Button>

                <Button variant="secondary">
                  <Share2 size={20} />
                  Share
                </Button>
              </div>

              {/* Description */}
              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-3">About this video</h3>
                <p className="text-gray-300 leading-relaxed">{video.description}</p>
              </div>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>

              {/* Add Comment */}
              {user ? (
                <form onSubmit={handleAddComment} className="mb-8">
                  <Card className="p-6">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-gray-900 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-3 mt-3">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={commenting || !comment.trim()}
                      >
                        {commenting ? <Loader2 size={20} className="animate-spin" /> : 'Post Comment'}
                      </Button>
                    </div>
                  </Card>
                </form>
              ) : (
                <Card className="p-6 mb-8">
                  <p className="text-gray-400">
                    <a href="/login" className="text-brand-400 hover:text-brand-300">
                      Sign in
                    </a>
                    {' '}to comment
                  </p>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-islamic-teal flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{c.users?.full_name}</h4>
                        <p className="text-gray-400 mt-2">{c.content}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="text-sm text-gray-500 hover:text-brand-400">Like</button>
                          <button className="text-sm text-gray-500 hover:text-brand-400">Reply</button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Creator Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-500 to-islamic-teal flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {video.users?.full_name}
                    </h3>
                    <p className="text-sm text-gray-400">Creator</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  Subscribe
                </Button>
              </Card>
            </motion.div>

            {/* Related Videos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
              <div className="space-y-3">
                {/* Related videos will be displayed here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <VideoGrid title="More Videos" limit={8} />
    </div>
  );
}
