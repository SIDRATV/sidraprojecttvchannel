/**
 * Safe API error helper — never exposes internal DB/stack details in production.
 * In development the real message is returned so you can debug.
 *
 * Usage:
 *   return NextResponse.json({ error: apiError(err) }, { status: 500 });
 */
export function apiError(err: unknown, fallback = 'An error occurred. Please try again.'): string {
  if (process.env.NODE_ENV === 'development') {
    return (err as any)?.message ?? fallback;
  }
  return fallback;
}

/** Specific safe messages for known Supabase error codes */
export function dbError(err: unknown): string {
  const msg = (err as any)?.message ?? '';
  // Expose safe, user-friendly messages for common DB constraint violations
  if (msg.includes('unique') || msg.includes('duplicate')) return 'This resource already exists.';
  if (msg.includes('foreign key') || msg.includes('violates')) return 'Invalid reference data.';
  if (msg.includes('not found') || msg.includes('No rows')) return 'Resource not found.';
  return apiError(err);
}
