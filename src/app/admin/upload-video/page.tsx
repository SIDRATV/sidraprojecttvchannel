'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  Image,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Film,
  Sparkles,
  Loader2,
  Trash2,
  Eye,
  Calendar,
  HardDrive,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { categoryService } from '@/services/categories';
import { premiumVideoService } from '@/services/premiumVideos';
import type { Category } from '@/types';
import type { PremiumVideoWithRelations } from '@/types/premium';

export default function AdminUploadVideoPage() {
  const { user, session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingVideos, setExistingVideos] = useState<PremiumVideoWithRelations[]>([]);
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quality, setQuality] = useState('720p');
  const [minPlan, setMinPlan] = useState('pro');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
    loadExistingVideos();
  }, []);

  const loadExistingVideos = async () => {
    const videos = await premiumVideoService.getVideos(50);
    setExistingVideos(videos);
  };

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }, []);

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }, []);

  const clearVideoFile = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const clearThumbnailFile = () => {
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!videoFile || !thumbnailFile || !title.trim() || !session?.access_token) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('quality', quality);
    formData.append('min_plan', minPlan);
    if (categoryId) formData.append('category_id', categoryId);

    const result = await premiumVideoService.uploadVideo(
      formData,
      session.access_token,
      setUploadProgress,
    );

    if (result.success) {
      setUploadResult({ success: true, message: 'Video uploaded successfully!' });
      // Reset form
      setTitle('');
      setDescription('');
      setCategoryId('');
      setQuality('720p');
      setMinPlan('pro');
      clearVideoFile();
      clearThumbnailFile();
      loadExistingVideos();
    } else {
      setUploadResult({ success: false, message: result.error || 'Upload failed' });
    }

    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token || !confirm('Are you sure you want to delete this video?')) return;
    setDeleting(id);
    const result = await premiumVideoService.deleteVideo(id, session.access_token);
    if (result.success) {
      setExistingVideos((prev) => prev.filter((v) => v.id !== id));
    }
    setDeleting(null);
  };

  // TODO: re-enable admin guard once user roles are configured
  // if (!user?.is_admin) { ... }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-400 rounded-xl flex items-center justify-center">
                  <Film size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">Premium Video Manager</h1>
                  <p className="text-xs text-slate-400">Upload &amp; manage R2-stored content</p>
                </div>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              {(['upload', 'manage'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveView(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeView === tab
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'upload' ? 'Upload' : 'Manage'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeView === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Upload Result Toast */}
              <AnimatePresence>
                {uploadResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      uploadResult.success
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {uploadResult.success ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{uploadResult.message}</span>
                    <button onClick={() => setUploadResult(null)} className="ml-auto">
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Dropzones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video dropzone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Video File *</label>
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      videoFile
                        ? 'border-brand-500/50 bg-brand-500/5'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                    }`}
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    {videoFile ? (
                      <div className="space-y-3">
                        {videoPreview && (
                          <video
                            src={videoPreview}
                            className="w-full max-h-40 rounded-lg object-cover mx-auto"
                            muted
                          />
                        )}
                        <div className="flex items-center justify-center gap-2">
                          <Video size={16} className="text-brand-400" />
                          <span className="text-sm text-slate-300 truncate max-w-[200px]">
                            {videoFile.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearVideoFile();
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload size={32} className="mx-auto text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Click to select video
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            MP4, WebM, MOV, AVI — Max 500 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail dropzone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Thumbnail *</label>
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      thumbnailFile
                        ? 'border-gold-500/50 bg-gold-500/5'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                    }`}
                  >
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />
                    {thumbnailFile ? (
                      <div className="space-y-3">
                        {thumbnailPreview && (
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full max-h-40 rounded-lg object-cover mx-auto"
                          />
                        )}
                        <div className="flex items-center justify-center gap-2">
                          <Image size={16} className="text-gold-400" />
                          <span className="text-sm text-slate-300 truncate max-w-[200px]">
                            {thumbnailFile.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({(thumbnailFile.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearThumbnailFile();
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Image size={32} className="mx-auto text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Click to select thumbnail
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            JPEG, PNG, WebP — Max 10 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Form */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-gold-400" />
                  Video Details
                </h3>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
                  />
                </div>

                {/* Category + Quality + Min Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p (Recommended)</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Minimum Plan</label>
                    <select
                      value={minPlan}
                      onChange={(e) => setMinPlan(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 size={20} className="text-brand-400 animate-spin" />
                    <span className="text-sm font-medium text-slate-300">
                      Uploading to Cloudflare R2... {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleUpload}
                disabled={uploading || !videoFile || !thumbnailFile || !title.trim()}
                className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                  uploading || !videoFile || !thumbnailFile || !title.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-500 to-brand-400 hover:shadow-lg hover:shadow-brand-500/25'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Premium Video
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            /* ──── Manage Tab ──── */
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Uploaded Videos ({existingVideos.length})
                </h2>
                <button
                  onClick={loadExistingVideos}
                  className="text-sm text-brand-400 hover:text-brand-300"
                >
                  Refresh
                </button>
              </div>

              {existingVideos.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Video size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No premium videos uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      layout
                      className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-28 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={20} className="text-slate-500" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{video.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {video.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive size={12} />{' '}
                            {video.quality_options?.join(', ') || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />{' '}
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              video.min_plan === 'vip'
                                ? 'bg-purple-500/20 text-purple-400'
                                : video.min_plan === 'premium'
                                ? 'bg-gold-500/20 text-gold-400'
                                : 'bg-brand-500/20 text-brand-400'
                            }`}
                          >
                            {video.min_plan?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/watch/premium/${video.id}`}
                          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deleting === video.id}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {deleting === video.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
