import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'sidra_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const key = process.env.ADMIN_SECRET_KEY;
  if (!key) throw new Error('ADMIN_SECRET_KEY is not configured');
  return key;
}

function getSigningKey(): string {
  return process.env.ADMIN_SESSION_SIGNING_KEY || process.env.ADMIN_SECRET_KEY || '';
}

function signSession(payload: string): string {
  return createHmac('sha256', getSigningKey()).update(payload).digest('hex');
}

function buildSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin:${expiresAt}`;
  const sig = signSession(payload);
  // base64url so it's safe in a cookie value
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [prefix, expiresAtStr, sig] = parts;
    if (prefix !== 'admin') return false;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    const payload = `${prefix}:${expiresAtStr}`;
    const expected = signSession(payload);
    // Timing-safe comparison
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

// GET — check if current admin session cookie is valid
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

// POST — validate admin secret key, set session cookie
export async function POST(request: NextRequest) {
  let body: { key?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const submittedKey = String(body.key ?? '');
  if (!submittedKey) {
    return NextResponse.json({ error: 'Admin key is required' }, { status: 400 });
  }

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 });
  }

  // Timing-safe comparison to prevent timing attacks
  const secretBuf = Buffer.from(secret, 'utf8');
  const submittedBuf = Buffer.from(submittedKey.padEnd(secret.length, '\0'), 'utf8').slice(0, secretBuf.length);
  // Pad submitted to same length for safe comparison
  const paddedSubmitted = Buffer.alloc(secretBuf.length, 0);
  Buffer.from(submittedKey, 'utf8').copy(paddedSubmitted, 0, 0, secretBuf.length);
  const isValid = submittedKey.length === secret.length && timingSafeEqual(paddedSubmitted, secretBuf);

  if (!isValid) {
    // Log intrusion attempt (best-effort)
    console.warn(`[admin-verify] Failed admin key attempt from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
    // Artificial delay to further slow brute-force
    await new Promise(r => setTimeout(r, 500));
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
  }

  const sessionToken = buildSessionToken();

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });

  return response;
}

// DELETE — sign out (clear session cookie)
export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// Export verifySessionToken for use in middleware / other routes
export { verifySessionToken, COOKIE_NAME };
