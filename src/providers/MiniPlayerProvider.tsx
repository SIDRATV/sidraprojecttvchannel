'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface MiniPlayerData {
  streamUrl: string;
  title: string;
  thumbnail: string;
  videoId: string;
  startTime: number;
}

/** Data stored after mini-player is closed via "expand" so the video page can resume */
export interface ResumeData {
  videoId: string;
  streamUrl: string;
  currentTime: number;
}

interface MiniPlayerContextValue {
  miniPlayer: (MiniPlayerData & { active: true }) | null;
  /** Populated when user expands mini-player — consumed once by the video page */
  resumeData: ResumeData | null;
  /** Whether the mini-player is animating out (shrink / expand) */
  animating: 'shrink' | 'expand' | null;
  startMiniPlayer: (data: MiniPlayerData) => void;
  closeMiniPlayer: () => void;
  /** Called when expanding: sets resumeData, clears mini-player, triggers expand animation */
  expandMiniPlayer: () => ResumeData | null;
  consumeResumeData: () => void;
  setAnimating: (v: 'shrink' | 'expand' | null) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue>({
  miniPlayer: null,
  resumeData: null,
  animating: null,
  startMiniPlayer: () => {},
  closeMiniPlayer: () => {},
  expandMiniPlayer: () => null,
  consumeResumeData: () => {},
  setAnimating: () => {},
});

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [miniPlayer, setMiniPlayer] = useState<(MiniPlayerData & { active: true }) | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [animating, setAnimating] = useState<'shrink' | 'expand' | null>(null);

  // Keep a ref to the video element's current time (updated by MiniPlayer component)
  const currentTimeRef = { current: 0 };

  const startMiniPlayer = useCallback((data: MiniPlayerData) => {
    setAnimating('shrink');
    setMiniPlayer({ ...data, active: true });
    // Clear shrink animation after it plays
    setTimeout(() => setAnimating(null), 500);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setMiniPlayer(null);
    setAnimating(null);
  }, []);

  const expandMiniPlayer = useCallback((): ResumeData | null => {
    if (!miniPlayer) return null;
    const data: ResumeData = {
      videoId: miniPlayer.videoId,
      streamUrl: miniPlayer.streamUrl,
      currentTime: miniPlayer.startTime, // Will be overridden by MiniPlayer component
    };
    setResumeData(data);
    setAnimating('expand');
    setMiniPlayer(null);
    setTimeout(() => setAnimating(null), 500);
    return data;
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
