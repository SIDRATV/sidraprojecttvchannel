'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize, Info } from 'lucide-react';
import { useState, useRef } from 'react';

interface YouTubePlayerModalProps {
  videoId: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Architecture de lecture vidéo:
 * - Reçoit UNIQUEMENT le videoId (métadonnées viennent de /api/videos)
 * - Utilise YouTube IFrame Player API (embed)
 * - TOUTE la lecture est gérée par YouTube (play, pause, volume, etc)
 * - Pas d'appels API supplémentaires pour la LECTURE
 */
export function YouTubePlayerModal({ 
  videoId, 
  title, 
  description,
  isOpen, 
  onClose 
}: YouTubePlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&fs=1&playsinline=1&enablejsapi=1`;

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (!isFullscreen) {
        if (iframeRef.current.requestFullscreen) {
          iframeRef.current.requestFullscreen().catch(err => {
            console.error('Erreur fullscreen:', err);
          });
          setIsFullscreen(true);
        }
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-4"
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[90vh] bg-gray-950 rounded-lg overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold text-white truncate">{title}</h2>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {description && (
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                    title="Afficher infos"
                  >
                    <Info size={20} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                  title="Fermer (Échap)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="bg-black relative w-full">
              {/* Aspect Ratio Container (16:9) */}
              <div className="w-full" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                <iframe
                  ref={iframeRef}
                  src={youtubeEmbedUrl}
                  title={title}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    border: 'none',
                    borderRadius: 'inherit',
                  }}
                />
              </div>

              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-end gap-2">
                <button
                  onClick={handleFullscreen}
                  className="p-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-medium flex items-center gap-2 shadow-lg"
                  title="Plein écran"
                >
                  <Maximize size={18} />
                  <span className="hidden sm:inline text-sm">Plein écran</span>
                </button>
              </div>
            </div>

            {/* Info Panel */}
            {showInfo && description && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 md:p-6 bg-gray-900 border-t border-gray-700"
              >
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                <p className="text-sm md:text-base text-gray-300 line-clamp-3">
                  {description}
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
