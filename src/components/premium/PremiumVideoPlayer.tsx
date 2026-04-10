'use client';

import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';

interface PremiumVideoPlayerProps {
  streamUrl: string;
  title: string;
  quality: string;
  availableQualities: string[];
  onQualityChange: (quality: string) => void;
  onBack?: () => void;
  /** Seek to this timestamp (seconds) when the video first loads */
  startTime?: number;
  /** Called on every timeupdate and play/pause — update a ref, not state */
  onStateChange?: (state: { currentTime: number; isPlaying: boolean }) => void;
}

export function PremiumVideoPlayer({
  streamUrl,
  title,
  quality,
  availableQualities,
  onQualityChange,
  onBack,
  startTime,
  onStateChange,
}: PremiumVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const isPlayingRef = useRef(false);
  // Keep a stable ref to the callback so event listeners never go stale
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  // Track whether startTime has been applied (reset when streamUrl changes)
  const startTimeAppliedRef = useRef(false);
  useEffect(() => { startTimeAppliedRef.current = false; }, [streamUrl]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlayingRef.current) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onStateChangeRef.current?.({ currentTime: video.currentTime, isPlaying: !video.paused });
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => {
      setIsLoading(false);
      // Seek to startTime once, right after the video is ready
      if (!startTimeAppliedRef.current && startTime && startTime > 0) {
        startTimeAppliedRef.current = true;
        video.currentTime = startTime;
      }
    };
    const onPlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
      resetHideTimer();
      onStateChangeRef.current?.({ currentTime: video.currentTime, isPlaying: true });
    };
    const onPause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      setShowControls(true);
      onStateChangeRef.current?.({ currentTime: video.currentTime, isPlaying: false });
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [streamUrl]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    resetHideTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group select-none"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onMouseLeave={() => isPlayingRef.current && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        playsInline
        preload="auto"
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 size={40} className="text-white animate-spin" />
        </div>
      )}

      {/* Big center play button (when paused) */}
      {!isPlaying && !isLoading && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="p-5 bg-brand-500/80 backdrop-blur-sm rounded-full shadow-2xl shadow-brand-500/40">
            <Play size={36} className="text-white ml-1" fill="white" />
          </div>
        </motion.button>
      )}

      {/* Controls overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex flex-col justify-between pointer-events-none"
      >
        {/* Top bar */}
        <div className={`flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
          )}
          <h3 className="text-white font-semibold text-sm truncate flex-1 mx-3">{title}</h3>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gold-500/80">
            {quality}
          </span>
        </div>

        {/* Bottom controls */}
        <div className={`p-4 bg-gradient-to-t from-black/80 to-transparent space-y-2 ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2.5 transition-all"
          >
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-gold-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                {isPlaying ? (
                  <Pause size={20} className="text-white" fill="white" />
                ) : (
                  <Play size={20} className="text-white" fill="white" />
                )}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  {isMuted ? (
                    <VolumeX size={18} className="text-white" />
                  ) : (
                    <Volume2 size={18} className="text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-brand-500 cursor-pointer"
                />
              </div>

              <span className="text-white/80 text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quality selector */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings size={16} className="text-white" />
                  <span className="text-white text-xs font-semibold">{quality}</span>
                </button>

                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-xl"
                  >
                    {availableQualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          onQualityChange(q);
                          setShowQualityMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-xs text-left hover:bg-white/10 transition-colors ${
                          q === quality ? 'text-gold-400 font-bold' : 'text-white'
                        }`}
                      >
                        {q}
                        {q === '1080p' && <span className="ml-2 text-gold-500/70">HD</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                {isFullscreen ? (
                  <Minimize size={18} className="text-white" />
                ) : (
                  <Maximize size={18} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
