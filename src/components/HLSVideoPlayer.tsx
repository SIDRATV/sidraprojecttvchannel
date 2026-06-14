'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings, AlertCircle, Zap } from 'lucide-react';
import {
  DiagnosticResult,
  createDiagnostic,
  logDiagnostic,
} from '@/utils/hlsDiagnostic';

interface HLSLevel {
  name: string;
  height: number;
  bitrate: number;
  index: number;
}

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
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<HLSLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isAutoQuality, setIsAutoQuality] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [corsRetried, setCorsRetried] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let isMounted = true;

    const canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl') === 'maybe';

    if (canPlayHLS || url.endsWith('.m3u8')) {
      if (!url.startsWith('http') && !url.startsWith('blob')) {
        const errMsg = 'URL invalide';
        setError(errMsg);
        const diag = createDiagnostic(
          { error: null, response: null },
          url
        );
        setDiagnostic(diag);
        logDiagnostic(diag);
        return;
      }

      if (canPlayHLS) {
        // Safari native HLS support
        video.src = url;
        setIsLoading(false);
      } else {
        // Use hls.js for other browsers
        import('hls.js')
          .then((HLS) => {
            if (!isMounted) return;

            const hls = new HLS.default({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
              // ABR Configuration
              abrEwmaFastLive: 5000,
              abrEwmaSlowLive: 9000,
              abrEwmaFastVoD: 4000,
              abrEwmaSlowVoD: 15000,
              abrMaxWithRealBitrate: true,
              abrBandWidthFactor: 0.95,
              // Never use lowest quality
              maxLoadingDelay: 4,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            hlsRef.current = hls;

            // Parse and set available levels
            hls.on('hlsManifestParsed' as any, () => {
              if (isMounted) {
                const levels = hls.levels.map((level: any, index: number) => ({
                  name: level.height ? `${level.height}p` : `Level ${index}`,
                  height: level.height || 0,
                  bitrate: level.bitrate || 0,
                  index: index,
                }));
                
                console.log('[HLS Levels Detected]:', {
                  count: levels.length,
                  levels: levels.map(l => ({ name: l.name, bitrate: l.bitrate })),
                  currentLevel: hls.currentLevel,
                });
                
                setAvailableLevels(levels);
                setCurrentLevel(hls.currentLevel);
                setIsAutoQuality(hls.autoLevelEnabled);
                setIsLoading(false);
              }
            });

            // Update current level when it changes
            hls.on('hlsLevelSwitching' as any, (event: any) => {
              if (isMounted) {
                setCurrentLevel(hls.currentLevel);
              }
            });

            // Handle auto level changes
            hls.on('hlsLevelUpdating' as any, (event: any) => {
              if (isMounted && hls.autoLevelEnabled) {
                setIsAutoQuality(true);
              }
            });

            hls.on('hlsError' as any, (event: any) => {
              if (isMounted) {
                const diag = createDiagnostic(event, url);
                const isCors = event?.error?.details?.includes('CORS') || 
                              event?.error?.message?.includes('CORS') ||
                              event?.error?.type === 'networkError';

                // Retry with proxy if CORS error and haven't tried yet
                if (isCors && !corsRetried) {
                  console.warn('[CORS Error] Retrying with proxy...', event?.error?.message);
                  setCorsRetried(true);
                  const proxiedUrl = `/api/proxy-stream?url=${encodeURIComponent(url)}`;
                  setCurrentUrl(proxiedUrl);
                  hls.loadSource(proxiedUrl);
                  return;
                }

                setDiagnostic(diag);
                setError(diag.message);
                setShowDiagnostic(true);

                // Log to console
                logDiagnostic(diag);

                // Callback
                onError?.(new Error(diag.message));

                // Log additional HLS.js error details
                if (event?.error) {
                  console.error('[HLS.js Error Details]:', {
                    type: event.error.type,
                    details: event.error.details,
                    fatal: event.error.fatal,
                    message: event.error.message,
                    rawEvent: event,
                  });
                }
              }
            });

            // Additional error logging
            hls.on('hlsFatal' as any, (event: any) => {
              if (isMounted) {
                const diag = createDiagnostic(event, url);
                setDiagnostic(diag);
                setError(diag.message);
                setShowDiagnostic(true);

                logDiagnostic(diag);
                onError?.(new Error(diag.message));

                console.error('[HLS.js Fatal Error]:', {
                  type: event?.error?.type,
                  details: event?.error?.details,
                  message: event?.error?.message,
                });
              }
            });

            // Segment loading error
            hls.on('hlsFragError' as any, (event: any) => {
              if (isMounted) {
                console.warn('[HLS Fragment Load Error]:', {
                  frag: event?.frag,
                  error: event?.error,
                });
              }
            });

            return () => {
              hls.destroy();
            };
          })
          .catch((err) => {
            if (isMounted) {
              video.src = url;
              setIsLoading(false);
            }
          });
      }
    } else {
      video.src = url;
      setIsLoading(false);
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleError = (evt: Event) => {
      console.error('[Video Element Error]:', {
        error: videoRef.current?.error,
        code: videoRef.current?.error?.code,
        message: videoRef.current?.error?.message,
      });

      const diag = createDiagnostic(
        {
          error: {
            type: 'mediaError',
            details: `Code ${videoRef.current?.error?.code}`,
          },
          response: null,
        },
        url
      );
      setDiagnostic(diag);
      setError(diag.message);
      setShowDiagnostic(true);

      logDiagnostic(diag);
      onError?.(new Error(diag.message));
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

  const selectQuality = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setIsAutoQuality(false);
      setCurrentLevel(levelIndex);
      setShowQualityMenu(false);
    }
  }, []);

  const toggleAutoQuality = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.autoLevelEnabled = !isAutoQuality;
      setIsAutoQuality(!isAutoQuality);
      if (!isAutoQuality) {
        // When auto is enabled, set to highest available level first
        setCurrentLevel(hlsRef.current.levels.length - 1);
      }
    }
  }, [isAutoQuality]);

  const getCurrentQualityName = (): string => {
    if (isAutoQuality) return 'Auto';
    if (currentLevel >= 0 && availableLevels.length > 0) {
      return availableLevels[currentLevel]?.name || 'Auto';
    }
    return 'Auto';
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

      {/* Error Message with Diagnostic */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center max-w-md px-4">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-300 font-semibold text-lg mb-2">{error}</p>
            <p className="text-gray-300 text-sm mb-4">{diagnostic?.details}</p>

            <button
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 rounded-lg transition-colors text-sm font-medium mb-3 w-full justify-center"
            >
              <Zap size={16} />
              {showDiagnostic ? 'Masquer' : 'Voir'} le diagnostic
            </button>

            {showDiagnostic && diagnostic && (
              <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 text-left text-xs space-y-2 max-h-64 overflow-y-auto">
                <div>
                  <p className="text-gray-400">Code d'erreur:</p>
                  <p className="text-yellow-300 font-mono font-bold">{diagnostic.errorCode}</p>
                </div>
                <div>
                  <p className="text-gray-400">Type:</p>
                  <p className="text-gray-200">{diagnostic.errorType}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sévérité:</p>
                  <p className={`font-semibold ${
                    diagnostic.severity === 'fatal' ? 'text-red-400' : 
                    diagnostic.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {diagnostic.severity.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Suggestions:</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{diagnostic.suggestion}</p>
                </div>
                {corsRetried && (
                  <div className="bg-blue-900/30 border border-blue-700 rounded p-2 mt-2">
                    <p className="text-blue-300 font-semibold mb-1">✓ Contournement CORS activé</p>
                    <p className="text-blue-200 text-xs">La requête est proxifiée pour contourner les restrictions CORS du serveur.</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400">URL:</p>
                  <p className="text-gray-300 break-all font-mono text-xs">{diagnostic.url}</p>
                </div>
                {diagnostic.statusCode && (
                  <div>
                    <p className="text-gray-400">Code HTTP:</p>
                    <p className="text-gray-200 font-mono">{diagnostic.statusCode}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {controls && !error && (
        <>
          {/* Quality Badge - Always Visible Top Right */}
          {isLoading === false && (
            <div className="absolute top-3 right-3 z-40">
              <div className="relative group/quality">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 border border-white/30 hover:border-white/50 rounded-lg transition-all"
                  title="Cliquer pour changer la qualité vidéo"
                >
                  <Settings size={14} className="text-white" />
                  <span className="text-white text-xs font-bold">
                    {getCurrentQualityName()}
                  </span>
                  {availableLevels.length > 1 && (
                    <span className="text-white text-xs opacity-60">▼</span>
                  )}
                </button>

                {/* Quality Menu */}
                {showQualityMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-black/95 border border-white/30 rounded-lg overflow-hidden shadow-xl z-50 backdrop-blur min-w-[180px]">
                    {/* Info Message */}
                    {availableLevels.length > 1 && currentLevel >= 0 && availableLevels[currentLevel]?.height >= 720 && (
                      <div className="px-3 py-2 bg-yellow-900/30 border-b border-yellow-700/50 text-[11px] text-yellow-200">
                        💡 Connexion faible? Choisissez 480p ou 360p
                      </div>
                    )}

                    {/* Auto Quality Option */}
                    <button
                      onClick={toggleAutoQuality}
                      className={`w-full px-3 py-2 text-xs font-medium text-left hover:bg-white/10 transition-colors ${
                        isAutoQuality ? 'bg-red-500/30 text-red-300 border-l-2 border-red-500' : 'text-gray-300'
                      }`}
                    >
                      <span className="font-bold">🔄 Auto</span>
                      {isAutoQuality && ' ✓'}
                      <div className="text-[10px] text-gray-400 mt-0.5">Ajuste selon connexion</div>
                    </button>

                    {/* Quality Options */}
                    {availableLevels.length > 0 ? (
                      availableLevels
                        .sort((a, b) => b.height - a.height)
                        .map((level) => {
                          let label = '';
                          if (level.height >= 2160) label = '4K - Très haute qualité';
                          else if (level.height >= 1080) label = 'Full HD - Haute qualité';
                          else if (level.height >= 720) label = 'HD - Bonne qualité';
                          else if (level.height >= 480) label = 'SD - Qualité réd.';
                          else label = 'Très réduite - Faible débit';

                          return (
                            <button
                              key={level.index}
                              onClick={() => selectQuality(level.index)}
                              className={`w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors ${
                                !isAutoQuality && currentLevel === level.index
                                  ? 'bg-red-500/30 text-red-300 border-l-2 border-red-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              <div className="font-medium">{level.name} {!isAutoQuality && currentLevel === level.index ? '✓' : ''}</div>
                              <div className="text-[10px] text-gray-400">
                                {label} • {level.bitrate > 0 ? `${(level.bitrate / 1000).toFixed(0)}kbps` : 'Variable'}
                              </div>
                            </button>
                          );
                        })
                    ) : (
                      <div className="px-3 py-3 text-xs text-gray-400 text-center">
                        📊 Qualités multi-variantes<br/>
                        <span className="text-[10px]">Gérées par le serveur</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls Bottom - Always Visible */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-8 pb-3 px-3"
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
            <div className="flex items-center gap-2">
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
        </div>
        </>
      )}
    </div>
  );
}
