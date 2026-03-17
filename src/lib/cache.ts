// ============ IN-MEMORY CACHE WITH TTL ============
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string | undefined;
  url: string;
  views: string;
  publishedAt: string;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlSeconds: number = 3600) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Create a singleton cache for videos (expires after 10 hours)
export const videosCache = new SimpleCache<VideoItem[]>(36000);

// ============ HTTP CACHE CONTROL UTILITIES ============

export const CACHE_CONFIG = {
  // Pages: Cache for 5 seconds with revalidation
  html: 'public, max-age=5, must-revalidate, s-maxage=10',

  // API responses: Cache for 5 seconds with revalidation
  api: 'public, max-age=5, must-revalidate, s-maxage=10',

  // Static assets: Cache for 1 hour
  assets: 'public, max-age=3600, must-revalidate',

  // Dynamic content: Cache for 5 seconds with revalidation
  dynamic: 'public, max-age=5, must-revalidate, s-maxage=10',
} as const;

/**
 * Get cache headers for different content types
 */
export function getCacheHeaders(type: 'html' | 'api' | 'assets' | 'dynamic' = 'dynamic') {
  const cacheControl = CACHE_CONFIG[type];

  return {
    'Cache-Control': cacheControl,
    'Pragma': 'cache',
  };
}

/**
 * Add cache-busting parameter to URL
 */
export function addCacheBustingParam(url: string, param = 'v'): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${param}=${Date.now()}`;
}

/**
 * Detect if a resource needs update
 */
export function shouldRevalidate(lastModified?: string | null): boolean {
  if (!lastModified) return true;

  const lastModTime = new Date(lastModified).getTime();
  const now = Date.now();

  // Revalidate if modified within last 24 hours
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return (now - lastModTime) < oneDayInMs;
}

/**
 * Build URL with cache busting
 * Usage: buildBustingUrl('/api/videos') => '/api/videos?v=1234567890'
 */
export function buildBustingUrl(
  path: string,
  params?: Record<string, string | number | boolean>
): string {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(path, origin);

    // Add cache-busting parameter
    url.searchParams.set('v', Date.now().toString());

    // Add additional parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    return url.pathname + url.search;
  } catch (error) {
    // Fallback if URL parsing fails
    const separator = path.includes('?') ? '&' : '?';
    return path + separator + 'v=' + Date.now();
  }
}

/**
 * Fetch with automatic cache busting
 */
export async function fetchWithCacheBusting(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const bustingUrl = addCacheBustingParam(url);

  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(options?.headers || {}),
  };

  return fetch(bustingUrl, {
    ...options,
    headers,
  });
}

/**
 * Clear all browser caches
 */
export async function clearAllCaches(): Promise<void> {
  try {
    // Clear localStorage items related to cache
    const keysToDelete = Object.keys(localStorage).filter(key =>
      key.startsWith('sidra_') || key.startsWith('__cache')
    );
    keysToDelete.forEach(key => localStorage.removeItem(key));

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }

    console.log('[Cache] All caches cleared successfully');
  } catch (error) {
    console.error('[Cache] Error clearing caches:', error);
  }
}

/**
 * Get current app version from build
 */
export function getAppVersion(): string {
  // This can be injected during build time
  return typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_VERSION || new Date().toISOString()) : new Date().toISOString();
}
