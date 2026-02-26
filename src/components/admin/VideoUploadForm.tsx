'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { videoService } from '@/services/videos';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function VideoUploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    video_type: 'documentary' as const,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get current user ID
      const { data: { user } } = await require('@/lib/supabase').supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      await videoService.createVideo({
        ...formData,
        created_by: user.id,
        views: 0,
        likes: 0,
        is_featured: false,
      } as any);

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        category_id: '',
        video_url: '',
        thumbnail_url: '',
        duration: 0,
        video_type: 'documentary',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Upload New Video</h2>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
        >
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2"
        >
          <CheckCircle size={20} className="text-green-400" />
          <span className="text-sm text-green-400">Video uploaded successfully!</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
            placeholder="Video title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
            placeholder="Video description"
          />
        </div>

        {/* Video Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Video Type</label>
          <select
            name="video_type"
            value={formData.video_type}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="documentary">Documentary</option>
            <option value="tutorial">Tutorial</option>
            <option value="news">News</option>
            <option value="interview">Interview</option>
          </select>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video URL (YouTube ID)</label>
            <input
              type="text"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              placeholder="YouTube video ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail URL</label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Duration & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              placeholder="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <input
              type="text"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              placeholder="Category UUID"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Video'
          )}
        </Button>
      </form>
    </Card>
  );
}
