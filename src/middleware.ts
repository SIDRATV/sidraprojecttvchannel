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
  
  // For protected routes, authentication is handled client-side with useAuth hook
  // This middleware just allows the request through
  
  // Users will be redirected to /login by the ProtectedRoute component if not authenticated
  return NextResponse.next();
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
