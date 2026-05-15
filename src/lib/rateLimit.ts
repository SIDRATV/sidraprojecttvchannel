/**
 * In-memory sliding-window rate limiter.
 *
 * On Vercel each serverless function instance has its own memory — this protects
 * against abuse within a single instance and catches the vast majority of bot traffic.
 * To upgrade to a fully distributed limiter, replace the in-memory store with
 * Upstash Redis (@upstash/ratelimit) — the call signature stays identical.
 *
 * Usage:
 *   const rl = rateLimit(request, { limit: 5, windowMs: 60_000, prefix: 'register' });
 *   if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const MAX_ENTRIES = 20_000; // cap to prevent unbounded memory growth

/** Purge expired entries — called automatically when the store gets large */
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

/**
 * Extract the real client IP, trying Cloudflare → Vercel → generic headers in order.
 * Never trusts X-Forwarded-For alone (easily spoofed) — but on Vercel the header
 * is injected by the infrastructure and is reliable.
 */
function clientIp(request: Request): string {
  const h = (name: string) => (request as any).headers?.get?.(name) ?? '';
  return (
    h('cf-connecting-ip') ||
    h('x-real-ip') ||
    h('x-forwarded-for').split(',')[0].trim() ||
    'unknown'
  );
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Namespace prefix — use a unique string per route */
  prefix: string;
}

export interface RateLimitResult {
  /** true = request is within limits, false = blocked */
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, prefix } = options;
  const key = `${prefix}:${clientIp(request)}`;
  const now = Date.now();

  if (store.size > MAX_ENTRIES) cleanup();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Returns a NextResponse-ready headers object with Retry-After */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.ok ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}
