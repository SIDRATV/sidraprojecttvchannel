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

let youtubeApiReady = false;
const apiReadyPromise = new Promise<void>((resolve) => {
  if (typeof window === 'undefined') return;
  
  if (window.YT) {
    youtubeApiReady = true;
    resolve();
    return;
  }

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    console.log('YouTube API ready');
    youtubeApiReady = true;
    resolve();
  };
});

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

  // Load YouTube Iframe API and initialize player
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = async () => {
      // Wait for API to be ready
      await apiReadyPromise;

      // Wait for container to exist in DOM
      let attempts = 0;
      while (!document.getElementById(containerId) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
      }

      // Clear previous content
      container.innerHTML = '';

      console.log(`Initializing YouTube player for video ${videoId}`);
      
      playerRef.current = new window.YT.Player(containerId, {
        height: '390',
        width: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    function onPlayerReady(event: any) {
      console.log('Player ready');
      setState((prev) => ({
        ...prev,
        isReady: true,
        duration: playerRef.current.getDuration(),
        volume: playerRef.current.getVolume(),
      }));
    }

    function onPlayerStateChange(event: any) {
      const YT = window.YT;
      const isPlaying = event.data === YT.PlayerState.PLAYING;
      setState((prev) => ({
        ...prev,
        isPlaying,
        currentTime: playerRef.current.getCurrentTime(),
      }));
    }

    initPlayer().catch(err => console.error('Failed to init player:', err));

    // Update time periodically
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration) {
        setState((prev) => ({
          ...prev,
          currentTime: playerRef.current.getCurrentTime(),
          buffered: playerRef.current.getVideoLoadedFraction() * 100,
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [videoId, containerId]);

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
