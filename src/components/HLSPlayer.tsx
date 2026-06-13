'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface HLSPlayerProps {
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * HLS Video Player Component
 * Supports M3U8 streams with fallback to native HTML5 video
 * Uses hls.js for HLS playback
 */
export function HLSPlayer({
  url,
  autoplay = false,
  controls = true,
  muted = false,
  className = 'w-full h-full',
  onError,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if HLS.js is supported
        const HLS = (window as any).HLS;

        if (!url) {
          throw new Error('No URL provided');
        }

        // M3U8 or HLS streams
        if (url.endsWith('.m3u8') || url.endsWith('.m3u')) {
          if (HLS && HLS.isSupported()) {
            // Use HLS.js
            const hls = new HLS({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              autoStartLoad: true,
            });

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on('hlsManifestParsed', () => {
              setLoading(false);
              if (autoplay) {
                video.play().catch(() => {
                  // Autoplay failed, likely due to browser policy
                  console.warn('Autoplay prevented by browser');
                });
              }
            });

            hls.on('hlsError', (event: any, data: any) => {
              if (data.fatal) {
                const errorMsg = `HLS Error: ${data.type}`;
                setError(errorMsg);
                onError?.(new Error(errorMsg));
              }
            });

            hlsRef.current = hls;
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
              setLoading(false);
              if (autoplay) video.play().catch(() => {});
            });
          } else {
            throw new Error('HLS not supported in this browser');
          }
        } else {
          // Standard MP4 or other formats
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            setLoading(false);
            if (autoplay) video.play().catch(() => {});
          });
        }

        video.addEventListener('error', () => {
          const errorMsg = 'Failed to load video';
          setError(errorMsg);
          onError?.(new Error(errorMsg));
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        onError?.(new Error(errorMsg));
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url, autoplay, onError]);

  return (
    <div className={`relative bg-black ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 size={40} className="animate-spin text-white" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-2 text-white">
            <AlertCircle size={32} className="text-red-500" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        controls={controls}
        muted={muted}
        className="w-full h-full"
        crossOrigin="anonymous"
      />
    </div>
  );
}

/**
 * Alternative: Simple stream player with support for different formats
 */
export function StreamPlayer({
  streamUrl,
  streamType = 'hls',
  title,
  autoplay = false,
}: {
  streamUrl: string;
  streamType?: 'hls' | 'http' | 'youtube' | 'rtmp';
  title?: string;
  autoplay?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  // Handle different stream types
  if (streamType === 'youtube') {
    const ytId = extractYoutubeId(streamUrl);
    if (!ytId) {
      return (
        <div className="w-full bg-black rounded-lg flex items-center justify-center aspect-video">
          <p className="text-red-500">Invalid YouTube URL</p>
        </div>
      );
    }

    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${ytId}?autoplay=${autoplay ? 1 : 0}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg aspect-video"
      />
    );
  }

  return (
    <div className="w-full">
      <HLSPlayer
        url={streamUrl}
        autoplay={autoplay}
        controls
        muted={false}
        className="w-full rounded-lg aspect-video"
        onError={(err) => setError(err.message)}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

/**
 * Extract YouTube ID from various URL formats
 */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/live\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
