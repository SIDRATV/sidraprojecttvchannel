'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMiniPlayer } from '@/providers/MiniPlayerProvider';

export function MiniPlayer() {
  const { miniPlayer, closeMiniPlayer } = useMiniPlayer();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Start playback when a new stream is activated
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayer) return;
    video.currentTime = miniPlayer.startTime;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniPlayer?.streamUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) { video.pause(); video.src = ''; }
    closeMiniPlayer();
  };

  const handleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const time = videoRef.current?.currentTime ?? 0;
    const videoId = miniPlayer?.videoId;
    const video = videoRef.current;
    if (video) { video.pause(); }
    closeMiniPlayer();
    router.push(`/premium-videos/${videoId}?t=${Math.floor(time)}`);
  };

  return (
    <AnimatePresence>
      {miniPlayer && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-20 right-3 sm:right-4 z-[9999] w-60 sm:w-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-700/60 bg-black cursor-pointer group select-none"
          onClick={() => handleExpand()}
        >
          {/* Video */}
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src={miniPlayer.streamUrl}
              className="w-full h-full object-cover"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-3">
              <button
                onClick={togglePlay}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30"
              >
                {isPlaying
                  ? <Pause size={16} className="text-white" fill="white" />
                  : <Play size={16} className="text-white ml-0.5" fill="white" />
                }
              </button>
              <button
                onClick={handleExpand}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30"
              >
                <Maximize2 size={16} className="text-white" />
              </button>
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>

            {/* Playing badge */}
            {isPlaying && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                EN COURS
              </div>
            )}
          </div>

          {/* Title bar */}
          <div className="px-3 py-2 bg-slate-900 flex items-center gap-2">
            <p className="text-white text-xs font-medium truncate flex-1">{miniPlayer.title}</p>
            <Maximize2 size={11} className="text-slate-400 flex-shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
