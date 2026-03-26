'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useState, useId } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

interface VideoPlayerModalProps {
  videoId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ videoId, title, isOpen, onClose }: VideoPlayerModalProps) {
  const containerId = useId().replace(/:/g, '_');
  const { controls, state } = useYouTubePlayer(videoId, containerId);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].filter((_, i) => (h === 0 && i === 0 ? false : true)).map(s => String(s).padStart(2, '0')).join(':');
  };

  const progress = state.duration ? (state.currentTime / state.duration) * 100 : 0;

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

            {/* Player */}
            <div className="bg-black flex-1 flex items-center justify-center overflow-hidden relative min-h-[500px]">
              <div id={containerId} className="w-full h-full min-h-[500px]" />
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 space-y-3">
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12">{formatTime(state.currentTime)}</span>
                <div className="flex-1 bg-gray-700 h-1 rounded-full cursor-pointer relative group" onClick={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  controls.seekTo(percent * state.duration);
                }}>
                  <div className="absolute h-1 bg-brand-500 rounded-full" style={{ width: `${progress}%` }} />
                  <div className="absolute h-3 w-3 bg-brand-500 rounded-full opacity-0 group-hover:opacity-100 -top-1" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }} />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{formatTime(state.duration)}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => (state.isPlaying ? controls.pause() : controls.play())}
                  className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
                >
                  {state.isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                </motion.button>

                <div className="flex items-center gap-2 ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isMuted) {
                        controls.unMute();
                      } else {
                        controls.mute();
                      }
                      setIsMuted(!isMuted);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </motion.button>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.volume}
                    onChange={(e) => controls.setVolume(parseInt(e.target.value))}
                    className="w-20 cursor-pointer"
                  />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const elem = document.getElementById(containerId);
                      if (elem?.requestFullscreen) {
                        elem.requestFullscreen();
                      }
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300 ml-4"
                  >
                    <Maximize size={20} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
