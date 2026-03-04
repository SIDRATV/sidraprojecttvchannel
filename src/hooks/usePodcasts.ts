import { useState, useCallback } from 'react';
import { podcastService, type Podcast } from '@/services/podcasts';

export function usePodcasts() {
  const [likedPodcasts, setLikedPodcasts] = useState<Set<string>>(new Set());
  const [bookmarkedPodcasts, setBookmarkedPodcasts] = useState<Set<string>>(new Set());

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
      if (newSet.has(podcastId)) {
        newSet.delete(podcastId);
      } else {
        newSet.add(podcastId);
      }
      return newSet;
    });
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookmarkedPodcasts', JSON.stringify(Array.from(bookmarkedPodcasts)));
    }
  }, [bookmarkedPodcasts]);

  const isLiked = useCallback((podcastId: string) => likedPodcasts.has(podcastId), [likedPodcasts]);
  const isBookmarked = useCallback((podcastId: string) => bookmarkedPodcasts.has(podcastId), [bookmarkedPodcasts]);

  return {
    likePodcast,
    bookmarkPodcast,
    isLiked,
    isBookmarked,
  };
}
