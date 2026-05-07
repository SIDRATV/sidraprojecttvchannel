/**
 * Local JWT verification using SUPABASE_JWT_SECRET.
 *
 * Why: supabase.auth.getUser(token) makes a network call to Supabase auth
 * servers on EVERY API request. With 20+ API routes called per page load
 * that means 20+ network round-trips just for auth verification.
 *
 * This function verifies the JWT signature + expiry locally using the
 * HMAC-SHA256 secret. No network call needed. Falls back to null on any error.
 *
 * Use this in non-sensitive API routes (notifications, voting, surveys, etc.).
 * Keep supabase.auth.getUser() only for high-security operations (wallet, admin).
 *
 * Setup: add SUPABASE_JWT_SECRET to your .env.local and Vercel environment.
 * Find it in: Supabase Dashboard → Settings → API → JWT Secret
 */

export interface JwtPayload {
  sub: string;     // user ID (UUID)
  email: string;
  role: string;    // 'authenticated' | 'anon'
  aud: string;
  exp: number;     // unix timestamp
  iat: number;
}

function b64url(str: string): Uint8Array {
  // Convert base64url → standard base64 → bytes
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

/**
 * Verify a Supabase JWT locally.
 * Returns the payload on success, null if invalid/expired/missing secret.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    // Secret not configured — cannot verify locally
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    // Decode payload (no signature check yet)
    const payloadBytes = b64url(payloadB64);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as JwtPayload;

    // Check expiry before doing the crypto work
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }

    // Verify HMAC-SHA256 signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64url(sigB64),
      enc.encode(`${headerB64}.${payloadB64}`),
    );

    return valid ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header.
 * Returns null if header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
