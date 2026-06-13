'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface HLSVideoPlayerProps {
  url: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

export function HLSVideoPlayer({
  url,
  title,
  autoplay = true,
  controls = true,
  loop = true,
  muted = false,
  onError,
  className = '',
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let isMounted = true;

    // Check if browser supports HLS natively
    const canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl') === 'maybe';

    if (canPlayHLS || url.endsWith('.m3u8')) {
      // Native HLS support (Safari) or use hls.js
      if (!url.startsWith('http') && !url.startsWith('blob')) {
        setError('URL invalide');
        return;
      }

      // For non-Safari browsers, try to load hls.js dynamically
      if (canPlayHLS) {
        video.src = url;
        setIsLoading(false);
      } else {
        // Dynamically import hls.js
        import('hls.js')
          .then((HLS) => {
            if (!isMounted) return;

            const hls = new HLS.default({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            });

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on('hlsManifestParsed' as any, () => {
              if (isMounted) setIsLoading(false);
            });

            hls.on('hlsError' as any, (event: any) => {
              if (isMounted) {
                const message = event?.response?.code ? `Erreur HLS: ${event.response.code}` : 'Erreur de chargement du flux';
                setError(message);
                onError?.(new Error(message));
              }
            });

            return () => {
              hls.destroy();
            };
          })
          .catch((err) => {
            if (isMounted) {
              // Fallback: try native video loading (for .m3u8 on compatible browsers)
              video.src = url;
              setIsLoading(false);
            }
          });
      }
    } else {
      // Not an M3U8 file, try native loading
      video.src = url;
      setIsLoading(false);
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleError = () => {
      const err = 'Impossible de charger le flux vidéo';
      setError(err);
      onError?.(new Error(err));
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      isMounted = false;
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [url, onError]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && videoRef.current?.parentElement) {
      videoRef.current.parentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative w-full bg-black rounded-lg overflow-hidden group ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <p className="text-red-400 font-semibold">{error}</p>
            <p className="text-gray-300 text-sm mt-2">Vérifiez l'URL du flux</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent pt-12 pb-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden cursor-pointer group/progress hover:h-1.5">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-white text-xs font-medium whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? (
                  <Pause size={16} className="text-white" />
                ) : (
                  <Play size={16} className="text-white" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white" />
                ) : (
                  <Volume2 size={16} className="text-white" />
                )}
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Plein écran"
            >
              {isFullscreen ? (
                <Minimize size={16} className="text-white" />
              ) : (
                <Maximize size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
