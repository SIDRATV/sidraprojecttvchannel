/**
 * proxy.ts — LEGACY FILE, kept for reference only.
 *
 * This file previously acted as the Next.js middleware (when named middleware.ts).
 * It has been replaced by src/middleware.ts which contains NO network calls.
 *
 * The maintenance-mode fetch that caused MIDDLEWARE_INVOCATION_TIMEOUT has been
 * removed. Maintenance mode is now checked exclusively by:
 *   - AppLayout.tsx  (client-side, via /api/maintenance + Realtime subscription)
 *   - /api/maintenance route (server-side, with its own timeout handling)
 *
 * DO NOT re-add any fetch() / DB calls to middleware.ts.
 */

export {};

