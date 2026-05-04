import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// ─── Server-side in-memory cache (per warm function instance) ────────────────
// Prevents hitting Supabase on every request while the function is warm.
// CDN-level caching (s-maxage=60) eliminates most DB hits entirely.
interface MaintenanceCache {
  enabled: boolean;
  message: string;
  expiresAt: number;
}
let _cache: MaintenanceCache | null = null;
const SERVER_CACHE_TTL = 60_000; // 60 s — matches CDN s-maxage

// GET /api/maintenance — returns only { enabled, message }
// Authentication and exemption checks were removed:
//   - Checking auth doubles Supabase calls on every page load
//   - Exemptions are enforced client-side in AppLayout via the sidra_uid cookie
//     that is set by AuthProvider (no extra network roundtrip needed)
export async function GET() {
  // Serve from in-memory cache if fresh
  if (_cache && _cache.expiresAt > Date.now()) {
    return buildResponse(_cache.enabled, _cache.message);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4_000);

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    if (error || !data) {
      return buildResponse(false, '');
    }

    const settings = data.value as { enabled: boolean; message?: string };

    // Populate in-memory cache
    _cache = {
      enabled: settings.enabled ?? false,
      message: settings.message ?? '',
      expiresAt: Date.now() + SERVER_CACHE_TTL,
    };

    return buildResponse(_cache.enabled, _cache.message);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      console.warn('[maintenance] DB query timed out — returning enabled:false');
    }
    // Safe default: never block the site on a DB error
    return buildResponse(false, '');
  }
}

function buildResponse(enabled: boolean, message: string) {
  return NextResponse.json(
    { enabled, message },
    {
      headers: {
        // CDN caches for 60 s; serves stale for up to 5 min while revalidating
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}


