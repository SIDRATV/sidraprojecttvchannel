'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SimpleVideoPlayerModalProps {
  videoId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleVideoPlayerModal({ videoId, title, isOpen, onClose }: SimpleVideoPlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;

  const handlePlay = () => {
    if (iframeRef.current) {
      iframeRef.current.style.display = 'block';
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white truncate">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} className="text-gray-300" />
              </button>
            </div>

            {/* Player Container */}
            <div className="bg-black flex-1 flex items-center justify-center overflow-hidden relative">
              <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe
                  ref={iframeRef}
                  width="100%"
                  height="100%"
                  src={youtubeEmbedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Simple Controls */}
            <div className="bg-gray-800 p-4 flex items-center justify-between gap-4">
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>

              <button
                onClick={handlePause}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Pause size={18} />
                Pause
              </button>

              <button
                onClick={handleFullscreen}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition ml-auto"
              >
                <Maximize size={18} />
                Fullscreen
              </button>
            </div>

            {/* Info */}
            <div className="bg-gray-900 px-6 py-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Tip: Use YouTube controls for full features (play, pause, seek, volume, subtitles)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
