import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  // Note: (app) is a route group, so URLs are /dashboard, /explore, etc (not /app/dashboard)
  const protectedPaths = ['/dashboard', '/explore', '/profile', '/settings', '/watchlist', '/watch', '/admin'];
  
  // Public auth routes
  const publicAuthRoutes = ['/login', '/signup'];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Create response
  const response = NextResponse.next();

  // Add cache control headers to prevent aggressive caching
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, public, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Add header to force browser validation
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Users will be redirected to /login by the ProtectedRoute component if not authenticated
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
