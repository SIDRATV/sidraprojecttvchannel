'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Play, Pause, X, Maximize2, GripHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMiniPlayer } from '@/providers/MiniPlayerProvider';

export function MiniPlayer() {
  const { miniPlayer, closeMiniPlayer } = useMiniPlayer();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
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

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const time = videoRef.current?.currentTime ?? 0;
    const videoId = miniPlayer?.videoId;
    const video = videoRef.current;
    if (video) { video.pause(); }
    closeMiniPlayer();
    router.push(`/premium-videos/${videoId}?t=${Math.floor(time)}`);
  };

  return (
    <>
      {/* Invisible full-screen drag boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

      <AnimatePresence>
        {miniPlayer && (
          <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            dragMomentum={false}
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.85 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-20 right-3 sm:right-4 z-[9999] w-60 sm:w-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-700/60 bg-black select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-center py-1 bg-slate-800/80 cursor-grab active:cursor-grabbing"
            >
              <GripHorizontal size={14} className="text-slate-500" />
            </div>

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

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={12} className="text-white" />
              </button>

              {/* Playing badge */}
              {isPlaying && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  EN COURS
                </div>
              )}
            </div>

            {/* Bottom bar: title + controls */}
            <div className="px-2.5 py-2 bg-slate-900 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                {isPlaying
                  ? <Pause size={13} className="text-white" fill="white" />
                  : <Play size={13} className="text-white ml-0.5" fill="white" />
                }
              </button>
              <p className="text-white text-xs font-medium truncate flex-1">{miniPlayer.title}</p>
              <button
                onClick={handleExpand}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                title="Agrandir"
              >
                <Maximize2 size={13} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
