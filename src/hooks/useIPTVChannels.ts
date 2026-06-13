'use client';

import { useState, useEffect, useRef } from 'react';

export interface IPTVChannel {
  name: string;
  url: string;
  country: string;
  category: string;
  logo?: string;
  groupTitle?: string;
}

export interface UseIPTVChannelsResult {
  channels: IPTVChannel[];
  loading: boolean;
  error: string | null;
  categories: string[];
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les chaînes IPTV d'un pays
 * Support debounce search, cache, et filtrage
 */
export function useIPTVChannels(
  country: string = 'fr',
  category?: string,
  searchQuery?: string
): UseIPTVChannelsResult {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const debounceTimer = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, { data: IPTVChannel[]; timestamp: number }>>(new Map());

  const fetchChannels = async (countryCode: string, cat?: string, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = `${countryCode}_${cat || ''}_${search || ''}`;
      const cached = cacheRef.current.get(cacheKey);
      
      // Check cache (5 minutes)
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setChannels(cached.data);
        const uniqueCategories = Array.from(new Set(cached.data.map(ch => ch.category)));
        setCategories(uniqueCategories);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (cat) params.append('category', cat);
      if (search) params.append('search', search);
      params.append('limit', '200');

      const response = await fetch(`/api/channels/${countryCode}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setChannels(data.channels || []);
      const uniqueCategories = Array.from(new Set((data.channels || []).map((ch: any) => ch.category)));
      setCategories(uniqueCategories);
      
      // Cache results
      cacheRef.current.set(cacheKey, { 
        data: data.channels || [], 
        timestamp: Date.now() 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch IPTV channels';
      setError(message);
      console.error('useIPTVChannels error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchChannels(country, category, searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [country, category, searchQuery]);

  const refetch = async () => {
    await fetchChannels(country, category, searchQuery);
  };

  return { channels, loading, error, categories, refetch };
}
