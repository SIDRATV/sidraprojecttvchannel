import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { LiveStream } from '@/services/live';

interface LiveStreamsOptions {
  viewType?: 'active' | 'all' | 'featured';
  category?: string;
}

async function fetchLiveStreams({ viewType = 'active', category }: LiveStreamsOptions): Promise<LiveStream[]> {
  let url = '/api/live?limit=50';
  if (viewType === 'active') url += '&type=active';
  else if (viewType === 'featured') url += '&type=featured';
  if (category) url += `&category=${encodeURIComponent(category)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function useLiveStreams(options: LiveStreamsOptions = {}) {
  const queryClient = useQueryClient();
  const { viewType = 'active', category = '' } = options;

  const query = useQuery<LiveStream[]>({
    queryKey: ['live-streams', viewType, category],
    queryFn: () => fetchLiveStreams({ viewType, category: category || undefined }),
    staleTime: 30 * 1000,          // live data — 30s fresh
    refetchInterval: 60 * 1000,    // background refresh every 60s for live counts
    refetchOnWindowFocus: false,
    gcTime: 2 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['live-streams'] });
  }, [queryClient]);

  return {
    streams: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    invalidate,
  };
}
