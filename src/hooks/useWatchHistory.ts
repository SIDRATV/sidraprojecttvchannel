'use client';

import { useState, useCallback, useEffect } from 'react';

export interface WatchHistoryEntry {
  id: string;
  title: string;
  image: string;
  duration?: string;
  category?: string;
  videoId?: string;
  watchedAt: number; // epoch ms
}

const STORAGE_KEY = 'sidra_watch_history';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readHistory(): WatchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: WatchHistoryEntry[] = JSON.parse(raw);
    const cutoff = Date.now() - TTL_MS;
    return all.filter((e) => e.watchedAt > cutoff);
  } catch {
    return [];
  }
}

function writeHistory(entries: WatchHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);

  // Load and clean expired entries on mount
  useEffect(() => {
    const h = readHistory();
    setHistory(h);
    writeHistory(h); // persist cleaned list
  }, []);

  /** Call this when the user starts watching a video */
  const addToHistory = useCallback((entry: Omit<WatchHistoryEntry, 'watchedAt'>) => {
    setHistory((prev) => {
      const cutoff = Date.now() - TTL_MS;
      // Remove stale + dedup by id, newest first, cap at 50 entries
      const filtered = prev.filter((e) => e.id !== entry.id && e.watchedAt > cutoff);
      const updated = [{ ...entry, watchedAt: Date.now() }, ...filtered].slice(0, 50);
      writeHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }, []);

  /** Returns entries from the last 24h, most recent first */
  const recent = history; // already filtered on load + addToHistory cleans each time

  return { history: recent, addToHistory, clearHistory };
}
