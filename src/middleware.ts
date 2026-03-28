import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE = 'sidra_admin_session';

function verifyAdminCookie(token: string): boolean {
  try {
    const signingKey = process.env.ADMIN_SESSION_SIGNING_KEY || process.env.ADMIN_SECRET_KEY || '';
    if (!signingKey) return false;
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [prefix, expiresAtStr, sig] = parts;
    if (prefix !== 'admin') return false;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    const payload = `${prefix}:${expiresAtStr}`;
    const expected = createHmac('sha256', signingKey).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/explore', '/profile', '/settings', '/watchlist', '/watch'];

  // Public auth routes
  const publicAuthRoutes = ['/login', '/signup'];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // ============ ADMIN ROUTE PROTECTION ============
  // Allow /api/admin/verify-key to pass through so the gate can function
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin/verify-key');
  if (isAdminRoute) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken || !verifyAdminCookie(adminToken)) {
      // For API routes under /admin, return 401 JSON
      if (pathname.startsWith('/admin/api') || request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json({ error: 'Admin session required' }, { status: 401 });
      }
      // For page routes, let the AdminKeyGate component handle the UI
      // (returning NextResponse.next() allows the page to render the gate)
      return NextResponse.next();
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

