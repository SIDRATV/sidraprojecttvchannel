import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/explore', '/profile', '/settings', '/watchlist', '/watch', '/admin'];

  // Public auth routes
  const publicAuthRoutes = ['/login', '/signup'];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Create response
  const response = NextResponse.next();

  // ============ STRICT NO-CACHE POLICY ============
  // Disable ALL caching for HTML pages and API routes
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('ETag', 'W/"' + Date.now() + '"');

  // ============ SECURITY & FORCE REVALIDATION ============
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Surrogate-Control', 'no-store');

  // ============ CDN BYPASS (important for cache networks) ============
  // Tell CDN to never cache this response
  response.headers.set('CDN-Cache-Control', 'no-cache, no-store');

  // ============ FORCE BROWSER VALIDATION ============
  // Tell browser to always check with server before showing cached version
  response.headers.set('Last-Modified', new Date().toUTCString());

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
