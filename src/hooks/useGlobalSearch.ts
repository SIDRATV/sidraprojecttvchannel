'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
      const pattern = `%${trimmed}%`;

      const db = supabase as any;
      const [videosRes, premiumRes, liveRes, podcastRes, newsRes, partnersRes, adsRes, votingRes, categoriesRes] = await Promise.allSettled([
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
        db
          .from('partners')
          .select('id, name, logo_url, type')
          .ilike('name', pattern)
          .limit(5),
        db
          .from('advertisements')
          .select('id, title, image_url, target_url')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('voting_projects')
          .select('id, title, image_url, description')
          .ilike('title', pattern)
          .limit(5),
        db
          .from('categories')
          .select('id, name, icon')
          .ilike('name', pattern)
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

        partners:
          partnersRes.status === 'fulfilled'
            ? (partnersRes.value.data ?? []).map((p: any) => ({
                id: p.id,
                title: p.name,
                type: 'partner' as const,
                thumbnail: p.logo_url,
                href: `/partners/${p.id}`,
                subtitle: p.type,
              }))
            : [],

        advertisements:
          adsRes.status === 'fulfilled'
            ? (adsRes.value.data ?? []).map((a: any) => ({
                id: a.id,
                title: a.title,
                type: 'advertisement' as const,
                thumbnail: a.image_url,
                href: a.target_url || `/explore`,
                subtitle: 'Publicité',
              }))
            : [],

        votingProjects:
          votingRes.status === 'fulfilled'
            ? (votingRes.value.data ?? []).map((p: any) => ({
                id: p.id,
                title: p.title,
                type: 'voting_project' as const,
                thumbnail: p.image_url,
                href: `/voting/${p.id}`,
                subtitle: 'Projet de vote',
              }))
            : [],

        categories:
          categoriesRes.status === 'fulfilled'
            ? (categoriesRes.value.data ?? []).map((c: any) => ({
                id: c.id,
                title: c.name,
                type: 'category' as const,
                thumbnail: c.icon,
                href: `/explore?category=${c.id}`,
                subtitle: 'Catégorie',
              }))
            : [],
      });

      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
