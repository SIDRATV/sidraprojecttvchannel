'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface MiniPlayerData {
  streamUrl: string;
  title: string;
  thumbnail: string;
  videoId: string;
  startTime: number;
  /** Full video object — stored so expand skips the API call */
  videoData?: any;
  quality?: string;
  availableQualities?: string[];
}

/** Data stored after mini-player is closed via "expand" so the video page can resume */
export interface ResumeData {
  videoId: string;
  streamUrl: string;
  currentTime: number;
  videoData?: any;
  quality?: string;
  availableQualities?: string[];
}

interface MiniPlayerContextValue {
  miniPlayer: (MiniPlayerData & { active: true }) | null;
  /** Populated when user expands mini-player — consumed once by the video page */
  resumeData: ResumeData | null;
  /** Whether the mini-player is animating out (shrink / expand) */
  animating: 'shrink' | 'expand' | null;
  startMiniPlayer: (data: MiniPlayerData) => void;
  closeMiniPlayer: () => void;
  /** Called when expanding: pass the live currentTime from the video element */
  expandMiniPlayer: (currentTime: number) => void;
  consumeResumeData: () => void;
  setAnimating: (v: 'shrink' | 'expand' | null) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue>({
  miniPlayer: null,
  resumeData: null,
  animating: null,
  startMiniPlayer: () => {},
  closeMiniPlayer: () => {},
  expandMiniPlayer: () => {},
  consumeResumeData: () => {},
  setAnimating: () => {},
});

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [miniPlayer, setMiniPlayer] = useState<(MiniPlayerData & { active: true }) | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [animating, setAnimating] = useState<'shrink' | 'expand' | null>(null);

  const startMiniPlayer = useCallback((data: MiniPlayerData) => {
    setAnimating('shrink');
    setMiniPlayer({ ...data, active: true });
    setTimeout(() => setAnimating(null), 500);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setMiniPlayer(null);
    setAnimating(null);
  }, []);

  const expandMiniPlayer = useCallback((currentTime: number) => {
    if (!miniPlayer) return;
    setResumeData({
      videoId: miniPlayer.videoId,
      streamUrl: miniPlayer.streamUrl,
      currentTime,
      videoData: miniPlayer.videoData,
      quality: miniPlayer.quality,
      availableQualities: miniPlayer.availableQualities,
    });
    setAnimating('expand');
    setMiniPlayer(null);
    setTimeout(() => setAnimating(null), 500);
  }, [miniPlayer]);

  const consumeResumeData = useCallback(() => {
    setResumeData(null);
  }, []);

  return (
    <MiniPlayerContext.Provider value={{
      miniPlayer, resumeData, animating,
      startMiniPlayer, closeMiniPlayer, expandMiniPlayer,
      consumeResumeData, setAnimating,
    }}>
      {children}
    </MiniPlayerContext.Provider>
  );
}

export const useMiniPlayer = () => useContext(MiniPlayerContext);
