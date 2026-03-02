// Simple in-memory cache with TTL (Time To Live)
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

// Create a singleton cache for videos (expires after 24 hours)
export const videosCache = new SimpleCache<VideoItem[]>(86400);
