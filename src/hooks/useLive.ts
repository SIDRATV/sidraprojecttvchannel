import { useState, useCallback, useEffect } from 'react';
import { liveService, type LiveStream } from '@/services/live';

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch { return new Set(); }
}

export function useLive() {
  const [followedStreams, setFollowedStreams] = useState<Set<string>>(() => readSet('followedStreams'));
  const [notificationsEnabled, setNotificationsEnabled] = useState<Set<string>>(() => readSet('liveNotifications'));

  // Persist changes — decoupled from callbacks to avoid stale closures
  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('followedStreams', JSON.stringify(Array.from(followedStreams)));
  }, [followedStreams]);

  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('liveNotifications', JSON.stringify(Array.from(notificationsEnabled)));
  }, [notificationsEnabled]);

  const followStream = useCallback((streamId: string) => {
    setFollowedStreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) newSet.delete(streamId);
      else newSet.add(streamId);
      return newSet;
    });
  }, []);

  const enableNotifications = useCallback((streamId: string) => {
    setNotificationsEnabled(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) newSet.delete(streamId);
      else newSet.add(streamId);
      return newSet;
    });
  }, []);

  const isFollowing = useCallback((streamId: string) => followedStreams.has(streamId), [followedStreams]);
  const hasNotifications = useCallback((streamId: string) => notificationsEnabled.has(streamId), [notificationsEnabled]);

  return {
    followStream,
    enableNotifications,
    isFollowing,
    hasNotifications,
  };
}
