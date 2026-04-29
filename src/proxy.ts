import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'sidra_admin_session';

// ============ MAINTENANCE MODE CACHE ============
let maintenanceCache: { enabled: boolean; exempt_user_ids: string[]; ts: number } | null = null;
const MAINTENANCE_CACHE_TTL = 10_000; // 10 seconds

async function checkMaintenanceMode(): Promise<{ enabled: boolean; exempt_user_ids: string[] }> {
  // Return cached result if fresh
  if (maintenanceCache && Date.now() - maintenanceCache.ts < MAINTENANCE_CACHE_TTL) {
    return { enabled: maintenanceCache.enabled, exempt_user_ids: maintenanceCache.exempt_user_ids };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return { enabled: false, exempt_user_ids: [] };
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      return { enabled: false, exempt_user_ids: [] };
    }

    const data = await res.json();
    if (data?.[0]?.value) {
      const val = data[0].value;
      maintenanceCache = {
        enabled: val.enabled ?? false,
        exempt_user_ids: val.exempt_user_ids ?? [],
        ts: Date.now(),
      };
      return { enabled: val.enabled ?? false, exempt_user_ids: val.exempt_user_ids ?? [] };
    }
  } catch {
    // On error, don't block the site
  }

  return { enabled: false, exempt_user_ids: [] };
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function verifyAdminCookie(token: string): Promise<boolean> {
  try {
    const signingKey = process.env.ADMIN_SESSION_SIGNING_KEY || process.env.ADMIN_SECRET_KEY || '';
    if (!signingKey) return false;
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [prefix, expiresAtStr, sig] = parts;
    if (prefix !== 'admin') return false;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    const payload = `${prefix}:${expiresAtStr}`;
    const expected = await hmacSha256(signingKey, payload);
    const sigBytes = hexToBytes(sig);
    const expectedBytes = hexToBytes(expected);
    return constantTimeEqual(sigBytes, expectedBytes);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/explore', '/profile', '/settings', '/watchlist', '/watch'];

  // Public auth routes
  const publicAuthRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // ============ ADMIN ROUTE PROTECTION ============
  // Allow /api/admin/verify-key to pass through so the gate can function
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin/verify-key');
  if (isAdminRoute) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken || !(await verifyAdminCookie(adminToken))) {
      // For API routes under /admin, return 401 JSON
      if (pathname.startsWith('/admin/api') || request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json({ error: 'Admin session required' }, { status: 401 });
      }
      // For page routes, let the AdminKeyGate component handle the UI
      // (returning NextResponse.next() allows the page to render the gate)
      return NextResponse.next();
    }
  }

  // ============ MAINTENANCE MODE CHECK ============
  // Skip maintenance for admin routes, maintenance page itself, auth routes, and static assets
  const isMaintenancePage = pathname === '/maintenance';
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/public/') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/);
  
  if (!isAdminRoute && !isMaintenancePage && !isAuthRoute && !isStaticAsset) {
    const maintenance = await checkMaintenanceMode();
    if (maintenance.enabled) {
      // Check if user is exempt via sidra_uid cookie (set by AuthProvider)
      let isExempt = false;
      
      const uidCookie = request.cookies.get('sidra_uid')?.value;
      if (uidCookie && maintenance.exempt_user_ids.includes(uidCookie)) {
        isExempt = true;
      }

      if (!isExempt) {
        const maintenanceUrl = new URL('/maintenance', request.url);
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  }

  // Create response
  const response = NextResponse.next();

  // Skip aggressive caching for static files (let them be cached normally)
  if (pathname.startsWith('/_next/') || pathname.startsWith('/public/') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)) {
    return response;
  }

  // ============ REASONABLE NO-CACHE POLICY FOR PAGES ============
  // Cache pages for 5 seconds, then revalidate in background
  response.headers.set('Cache-Control', 'public, max-age=5, must-revalidate, s-maxage=10');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', new Date(Date.now() + 5000).toUTCString());

  // ============ SECURITY HEADERS ============
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Users will be redirected to /login by the ProtectedRoute component if not authenticated
  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - handled separately
     * - _next/static (static files) - heavily cached
     * - _next/image (image optimization files) - cached
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};

