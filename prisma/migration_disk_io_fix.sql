-- ============================================================
-- DISK I/O FIX — Eliminate sequential scans + reduce table bloat
-- Run once in Supabase SQL Editor (Project → SQL Editor → New query)
-- All statements are idempotent (safe to run multiple times).
-- ============================================================


-- ── 1. VIDEOS — missing sort index (CRITICAL) ────────────────
-- Every public page load calls: ORDER BY created_at DESC
-- Without this index PostgreSQL does a full sequential scan.
CREATE INDEX IF NOT EXISTS idx_videos_created_at
  ON videos (created_at DESC);

-- Featured videos query: WHERE is_featured = true ORDER BY created_at DESC
-- Replaces two separate scans with one index-only scan.
CREATE INDEX IF NOT EXISTS idx_videos_featured_created
  ON videos (is_featured, created_at DESC)
  WHERE is_featured = true;


-- ── 2. PODCASTS — zero indexes (CRITICAL) ────────────────────
-- podcasts table was created with NO indexes. Every query is a full scan.

-- getPodcasts / getPodcastsByCategory: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at
  ON podcasts (created_at DESC);

-- getTrendingPodcasts: ORDER BY views DESC
CREATE INDEX IF NOT EXISTS idx_podcasts_views
  ON podcasts (views DESC);

-- getFeaturedPodcasts: WHERE is_featured = true
CREATE INDEX IF NOT EXISTS idx_podcasts_featured
  ON podcasts (is_featured)
  WHERE is_featured = true;

-- getPodcastsByCategory: WHERE category = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_podcasts_category_created
  ON podcasts (category, created_at DESC);


-- ── 3. PARTNERS — composite index for exact query pattern ────
-- Query: .in('status', ['active','featured']).order('status').order('rating', DESC)
-- Existing idx_partners_status covers the filter but not the sort.
CREATE INDEX IF NOT EXISTS idx_partners_status_rating
  ON partners (status, rating DESC);


-- ── 4. SPONSORED BANNERS — add priority sort index ───────────
-- Query: WHERE is_active=true AND starts_at<=now AND ends_at>=now
--         ORDER BY priority DESC, created_at DESC
-- idx_sponsored_banners_active already exists on (is_active, starts_at, ends_at)
-- Add composite for the ORDER BY:
CREATE INDEX IF NOT EXISTS idx_sponsored_banners_priority
  ON sponsored_banners (priority DESC, created_at DESC)
  WHERE is_active = true;


-- ── 5. USERS — is_admin lookup index ─────────────────────────
-- RLS policies on videos/podcasts/etc. call:
--   (SELECT is_admin FROM users WHERE id = auth.uid())
-- on every admin write. The PK index covers the WHERE id = ...,
-- but adding is_admin as a covering index eliminates the heap fetch.
CREATE INDEX IF NOT EXISTS idx_users_id_is_admin
  ON users (id)
  INCLUDE (is_admin);


-- ── 6. AUTOVACUUM tuning for high-write tables ───────────────
-- videos and podcasts have their `views` counter incremented on every play.
-- Each UPDATE creates a dead tuple. Default autovacuum fires too late,
-- causing table bloat and disk I/O to balloon.

-- Trigger autovacuum after 200 dead tuples (default: 20% of table size)
ALTER TABLE videos SET (
  autovacuum_vacuum_threshold      = 200,
  autovacuum_vacuum_scale_factor   = 0.01,   -- 1% of rows (vs default 20%)
  autovacuum_analyze_threshold     = 100,
  autovacuum_analyze_scale_factor  = 0.005   -- 0.5%
);

ALTER TABLE podcasts SET (
  autovacuum_vacuum_threshold      = 50,
  autovacuum_vacuum_scale_factor   = 0.01,
  autovacuum_analyze_threshold     = 25,
  autovacuum_analyze_scale_factor  = 0.005
);

-- wallet_transactions is frequently updated (status changes)
ALTER TABLE wallet_transactions SET (
  autovacuum_vacuum_threshold      = 100,
  autovacuum_vacuum_scale_factor   = 0.01,
  autovacuum_analyze_threshold     = 50,
  autovacuum_analyze_scale_factor  = 0.005
);


-- ── 7. Manual VACUUM ANALYZE ─────────────────────────────────
-- VACUUM cannot run inside a transaction block.
-- Run each line SEPARATELY in a new SQL Editor tab, one at a time:
--
--   VACUUM ANALYZE videos;
--   VACUUM ANALYZE podcasts;
--   VACUUM ANALYZE notifications;
--   VACUUM ANALYZE wallet_transactions;
--   VACUUM ANALYZE wallet_accounts;
--   VACUUM ANALYZE premium_videos;
--
-- Or use Supabase Dashboard → Database → Tables → [table] → Vacuum
