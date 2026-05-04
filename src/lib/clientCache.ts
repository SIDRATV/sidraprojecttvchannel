/**
 * Lightweight in-memory cache with stale-while-revalidate support.
 *
 * Strategy:
 *  - cachedFetch()      : standard cache — waits for fresh data on miss
 *  - swrFetch()         : stale-while-revalidate — returns stale data instantly,
 *                         triggers background refresh so next render is up-to-date
 *  - memoCacheGet/Set() : manual cache for non-fetch calls (Supabase service methods)
 *  - invalidateCache()  : call after mutations so stale data is never shown too long
 *
 * TTL guidelines:
 *   Notifications (user-specific, changes on interaction) → 15s
 *   Maintenance flag (rarely changes, Realtime covers it)  → 30s
 *   Videos / public content                               → 60s
 */

interface CacheEntry<T = unknown> {
  data: T | null;
  expiresAt: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry>();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeFetchPromise<T>(url: string, init: RequestInit, ttl: number, key: string): Promise<T> {
  const promise = fetch(url, init)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    })
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttl });
      return data;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });
  return promise;
}

// ─── cachedFetch ──────────────────────────────────────────────────────────────

/**
 * Fetch with in-memory cache and request deduplication.
 * Waits for fresh data on cache miss (classic cache).
 *
 * @param url   URL to fetch
 * @param init  RequestInit options
 * @param ttl   Cache TTL in ms (default: 30s)
 */
export async function cachedFetch<T = unknown>(
  url: string,
  init: RequestInit = {},
  ttl = 30_000
): Promise<T> {
  const key = url + JSON.stringify(init.headers ?? {});
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing) {
    if (existing.expiresAt > now) return existing.data as T;
    if (existing.promise) return existing.promise as Promise<T>;
  }

  const promise = makeFetchPromise<T>(url, init, ttl, key);
  cache.set(key, { data: existing?.data ?? null, expiresAt: 0, promise });
  return promise;
}

// ─── swrFetch ─────────────────────────────────────────────────────────────────

/**
 * Stale-while-revalidate fetch.
 *
 * - If fresh data exists → returns it immediately (no network call).
 * - If stale data exists → returns it immediately AND starts a background refresh.
 * - If no data exists    → fetches and waits (first load only).
 *
 * This eliminates loading spinners on repeat visits while keeping data fresh.
 * Call invalidateCache(url) after mutations to force the next render to re-fetch.
 *
 * @param url       URL to fetch
 * @param init      RequestInit options
 * @param ttl       How long data is considered "fresh" (default: 15s)
 * @param staleTtl  How long stale data is still usable (default: 5 min)
 * @param cacheKey  Optional explicit cache key override (avoids keying on headers like auth tokens)
 */
export async function swrFetch<T = unknown>(
  url: string,
  init: RequestInit = {},
  ttl = 15_000,
  staleTtl = 5 * 60_000,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey ?? (url + JSON.stringify(init.headers ?? {}));
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  // Fresh — return immediately
  if (existing?.data !== null && existing !== undefined && existing.expiresAt > now) {
    return existing.data as T;
  }

  // In-flight — join the existing promise
  if (existing?.promise) {
    return existing.promise as Promise<T>;
  }

  // Stale but usable — return stale data and kick off background refresh
  const staleData = existing?.data ?? null;
  const staleAge = existing ? now - (existing.expiresAt - ttl) : Infinity;
  if (staleData !== null && staleAge < staleTtl) {
    // Background refresh — don't await
    const promise = makeFetchPromise<T>(url, init, ttl, key);
    cache.set(key, { data: staleData, expiresAt: existing!.expiresAt, promise });
    promise.catch(() => {}); // prevent unhandled rejection
    return staleData as T;
  }

  // No data at all — must wait
  const promise = makeFetchPromise<T>(url, init, ttl, key);
  cache.set(key, { data: null, expiresAt: 0, promise });
  return promise;
}

// ─── Manual memo cache (for Supabase service calls) ──────────────────────────

/**
 * Store arbitrary data in the cache (for non-fetch async calls).
 * Pair with memoCacheGet() to build a service-level SWR pattern.
 */
export function memoCacheSet<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

/**
 * Read from the memo cache.
 * Returns { data, isStale } so callers can decide whether to revalidate.
 */
export function memoCacheGet<T>(key: string, staleTtl = 5 * 60_000): { data: T; isStale: boolean } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.data === null) return null;
  const now = Date.now();
  if (entry.expiresAt > now) return { data: entry.data, isStale: false };
  const age = now - entry.expiresAt;
  if (age < staleTtl) return { data: entry.data, isStale: true };
  return null;
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

/** Immediately evict all cache entries whose key starts with urlPrefix. */
export function invalidateCache(urlPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
}
