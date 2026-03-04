import { useState, useCallback } from 'react';
import { liveService, type LiveStream } from '@/services/live';

export function useLive() {
  const [followedStreams, setFollowedStreams] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState<Set<string>>(new Set());

  const followStream = useCallback((streamId: string) => {
    setFollowedStreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('followedStreams', JSON.stringify(Array.from(followedStreams)));
    }
  }, [followedStreams]);

  const enableNotifications = useCallback((streamId: string) => {
    setNotificationsEnabled(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveNotifications', JSON.stringify(Array.from(notificationsEnabled)));
    }
  }, [notificationsEnabled]);

  const isFollowing = useCallback((streamId: string) => followedStreams.has(streamId), [followedStreams]);
  const hasNotifications = useCallback((streamId: string) => notificationsEnabled.has(streamId), [notificationsEnabled]);

  return {
    followStream,
    enableNotifications,
    isFollowing,
    hasNotifications,
  };
}
