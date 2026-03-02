'use client';

import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  buffered: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer(videoId: string, containerId: string) {
  const playerRef = useRef<any>(null);
  const [state, setState] = useState<YouTubePlayerState>({
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    buffered: 0,
  });

  // Load YouTube Iframe API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.YT) {
      // API already loaded
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };
  }, []);

  // Initialize player
  useEffect(() => {
    if (typeof window === 'undefined' || !window.YT) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous player
    container.innerHTML = '';

    playerRef.current = new window.YT.Player(containerId, {
      height: '390',
      width: '100%',
      videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    function onPlayerReady() {
      setState((prev) => ({
        ...prev,
        isReady: true,
        duration: playerRef.current.getDuration(),
        volume: playerRef.current.getVolume(),
      }));
    }

    function onPlayerStateChange(event: any) {
      const YT = window.YT;
      setState((prev) => ({
        ...prev,
        isPlaying: event.data === YT.PlayerState.PLAYING,
        currentTime: playerRef.current.getCurrentTime(),
      }));
    }

    // Update time periodically
    const interval = setInterval(() => {
      if (playerRef.current && state.isReady) {
        setState((prev) => ({
          ...prev,
          currentTime: playerRef.current.getCurrentTime(),
          buffered: playerRef.current.getVideoLoadedFraction() * 100,
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [videoId, containerId, state.isReady]);

  const controls = {
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    stop: () => playerRef.current?.stopVideo(),
    seekTo: (seconds: number) => playerRef.current?.seekTo(seconds),
    setVolume: (vol: number) => {
      playerRef.current?.setVolume(vol);
      setState((prev) => ({ ...prev, volume: vol }));
    },
    mute: () => playerRef.current?.mute(),
    unMute: () => playerRef.current?.unMute(),
    getState: () => state,
  };

  return { controls, state, playerRef };
}
