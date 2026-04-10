'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface MiniPlayerData {
  streamUrl: string;
  title: string;
  thumbnail: string;
  videoId: string;
  startTime: number;
}

interface MiniPlayerContextValue {
  miniPlayer: (MiniPlayerData & { active: true }) | null;
  startMiniPlayer: (data: MiniPlayerData) => void;
  closeMiniPlayer: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue>({
  miniPlayer: null,
  startMiniPlayer: () => {},
  closeMiniPlayer: () => {},
});

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [miniPlayer, setMiniPlayer] = useState<(MiniPlayerData & { active: true }) | null>(null);

  const startMiniPlayer = useCallback((data: MiniPlayerData) => {
    setMiniPlayer({ ...data, active: true });
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setMiniPlayer(null);
  }, []);

  return (
    <MiniPlayerContext.Provider value={{ miniPlayer, startMiniPlayer, closeMiniPlayer }}>
      {children}
    </MiniPlayerContext.Provider>
  );
}

export const useMiniPlayer = () => useContext(MiniPlayerContext);
