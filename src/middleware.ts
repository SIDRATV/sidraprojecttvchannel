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
