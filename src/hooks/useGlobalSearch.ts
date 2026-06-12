'use client';

import { useState, useEffect } from 'react';

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: 'video' | 'premium_video' | 'live' | 'podcast' | 'news' | 'partner' | 'advertisement' | 'voting_project' | 'category';
  thumbnail?: string | null;
  href: string;
  subtitle?: string;
}

export interface GlobalSearchResults {
  videos: GlobalSearchResult[];
  premiumVideos: GlobalSearchResult[];
  liveStreams: GlobalSearchResult[];
  podcasts: GlobalSearchResult[];
  news: GlobalSearchResult[];
  partners: GlobalSearchResult[];
  advertisements: GlobalSearchResult[];
  votingProjects: GlobalSearchResult[];
  categories: GlobalSearchResult[];
}

const EMPTY: GlobalSearchResults = {
  videos: [],
  premiumVideos: [],
  liveStreams: [],
  podcasts: [],
  news: [],
  partners: [],
  advertisements: [],
  votingProjects: [],
  categories: [],
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 1) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        setResults(data.results || EMPTY);
      } catch (error) {
        console.error('Search error:', error);
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
