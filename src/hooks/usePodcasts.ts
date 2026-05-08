import { useState, useCallback, useEffect } from 'react';
import { podcastService, type Podcast } from '@/services/podcasts';

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch { return new Set(); }
}

export function usePodcasts() {
  const [likedPodcasts, setLikedPodcasts] = useState<Set<string>>(new Set());
  const [bookmarkedPodcasts, setBookmarkedPodcasts] = useState<Set<string>>(() => readSet('bookmarkedPodcasts'));

  // Persist bookmarks — decoupled from callback to avoid stale closures
  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('bookmarkedPodcasts', JSON.stringify(Array.from(bookmarkedPodcasts)));
  }, [bookmarkedPodcasts]);

  const likePodcast = useCallback(async (podcastId: string) => {
    try {
      await podcastService.likePodcast(podcastId);
      setLikedPodcasts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(podcastId)) {
          newSet.delete(podcastId);
        } else {
          newSet.add(podcastId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error liking podcast:', error);
    }
  }, []);

  const bookmarkPodcast = useCallback((podcastId: string) => {
    setBookmarkedPodcasts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(podcastId)) newSet.delete(podcastId);
      else newSet.add(podcastId);
      return newSet;
    });
  }, []);

  const isLiked = useCallback((podcastId: string) => likedPodcasts.has(podcastId), [likedPodcasts]);
  const isBookmarked = useCallback((podcastId: string) => bookmarkedPodcasts.has(podcastId), [bookmarkedPodcasts]);

  return {
    likePodcast,
    bookmarkPodcast,
    isLiked,
    isBookmarked,
  };
}
