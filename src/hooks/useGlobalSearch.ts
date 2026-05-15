'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: 'video' | 'premium_video' | 'live' | 'podcast' | 'news';
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
}

const EMPTY: GlobalSearchResults = {
  videos: [],
  premiumVideos: [],
  liveStreams: [],
  podcasts: [],
  news: [],
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      const pattern = `%${trimmed}%`;

      const db = supabase as any;
      const [videosRes, premiumRes, liveRes, podcastRes, newsRes] = await Promise.allSettled([
        supabase
          .from('videos')
          .select('id, title, thumbnail_url, youtube_url')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('premium_videos')
          .select('id, title, thumbnail_url')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('live_streams')
          .select('id, title, image, is_live')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('podcasts')
          .select('id, title, image, creator')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('news_articles')
          .select('id, title, image_url, category')
          .ilike('title', pattern)
          .limit(5),
      ]);

      setResults({
        videos:
          videosRes.status === 'fulfilled'
            ? (videosRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'video' as const,
                thumbnail: v.thumbnail_url,
                href: `/watch/${v.id}`,
              }))
            : [],

        premiumVideos:
          premiumRes.status === 'fulfilled'
            ? (premiumRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'premium_video' as const,
                thumbnail: v.thumbnail_url,
                href: `/premium-videos/${v.id}`,
              }))
            : [],

        liveStreams:
          liveRes.status === 'fulfilled'
            ? (liveRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'live' as const,
                thumbnail: v.image,
                href: `/live`,
                subtitle: v.is_live ? 'En direct' : 'Hors ligne',
              }))
            : [],

        podcasts:
          podcastRes.status === 'fulfilled'
            ? (podcastRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'podcast' as const,
                thumbnail: v.image,
                href: `/podcast`,
                subtitle: v.creator,
              }))
            : [],

        news:
          newsRes.status === 'fulfilled'
            ? (newsRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'news' as const,
                thumbnail: v.image_url,
                href: `/explore`,
                subtitle: v.category,
              }))
            : [],
      });

      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
