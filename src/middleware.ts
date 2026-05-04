/**
 * Next.js Edge Middleware — ultra-lightweight, NO network calls.
 *
 * Vercel Edge Runtime hard limit: ~50 ms wall-clock per invocation.
 * Rule: NEVER call fetch(), Supabase, or any external service here.
 *
 * What this middleware does (all synchronous / pure crypto):
 *  1. Protect /admin routes via HMAC-signed cookie verification
 *  2. Set security headers on every response
 *
 * What is intentionally NOT here:
 *  - Maintenance mode check  → handled client-side by AppLayout + Realtime
 *  - Auth session check      → handled client-side by ProtectedRoute
 *  - Any fetch() / DB call   → moved to API routes or client components
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'sidra_admin_session';

// ─── Pure crypto helpers (Edge-compatible Web Crypto API) ─────────────────────

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Constant-time comparison to prevent timing attacks */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

/**
 * Verify an HMAC-signed admin session cookie.
 * Format (base64-url): "admin:<expiresAt>:<hmac-hex>"
 * Pure crypto — NO network, NO DB.
 */
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
    return constantTimeEqual(hexToBytes(sig), hexToBytes(expected));
  } catch {
    return false;
  }
}

// ─── Security headers applied to every page response ─────────────────────────

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// ─── Middleware entry point ───────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Admin route guard ──────────────────────────────────────────────────────
  // Allow /api/admin/verify-key through so the admin gate page can function.
  const isAdminRoute =
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/api/admin/verify-key');

  if (isAdminRoute) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken || !(await verifyAdminCookie(adminToken))) {
      // API sub-routes under /admin → return 401 JSON
      if (
        pathname.startsWith('/admin/api') ||
        request.headers.get('accept')?.includes('application/json')
      ) {
        return NextResponse.json({ error: 'Admin session required' }, { status: 401 });
      }
      // Page routes → let AdminKeyGate component render the gate UI
      const response = NextResponse.next();
      applySecurityHeaders(response);
      return response;
    }
  }

  // ── Pass through everything else ───────────────────────────────────────────
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

// Scope middleware to page routes only.
// Excludes: API routes, Next.js internals, static files, and the maintenance page.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|maintenance).*)',
  ],
};
