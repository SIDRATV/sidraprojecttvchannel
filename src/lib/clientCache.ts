/**
 * Lightweight in-memory fetch cache with TTL.
 * Prevents duplicate API calls across components that mount simultaneously.
 *
 * Usage:
 *   const data = await cachedFetch('/api/videos?limit=6', {}, 30_000);
 */

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  promise?: Promise<unknown>;
}

const cache = new Map<string, CacheEntry>();

/**
 * Fetch with in-memory cache and request deduplication.
 * @param url      The URL to fetch
 * @param init     RequestInit options (merged with cache: 'no-store' for actual fetch)
 * @param ttl      Cache TTL in milliseconds (default: 30s)
 */
export async function cachedFetch<T = unknown>(
  url: string,
  init: RequestInit = {},
  ttl: number = 30_000
): Promise<T> {
  const key = url + JSON.stringify(init.headers ?? {});
  const now = Date.now();

  // Return cached value if still fresh
  const existing = cache.get(key);
  if (existing) {
    if (existing.expiresAt > now) {
      return existing.data as T;
    }
    // Reuse in-flight promise (deduplication)
    if (existing.promise) {
      return existing.promise as Promise<T>;
    }
  }

  // Start new fetch and store the promise immediately (dedup concurrent calls)
  const promise = fetch(url, init)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttl });
      return data;
    })
    .catch((err) => {
      // Remove failed entry so next call retries
      cache.delete(key);
      throw err;
    });

  cache.set(key, { data: null, expiresAt: 0, promise });
  return promise as Promise<T>;
}

/** Manually invalidate a cached URL (e.g. after a mutation) */
export function invalidateCache(urlPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}
