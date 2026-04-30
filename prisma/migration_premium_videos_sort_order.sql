-- ============================================================
-- Add sort_order column to premium_videos
-- Allows admin to manually classify/reorder videos in the dashboard.
-- Run once in Supabase SQL Editor — idempotent.
-- ============================================================

ALTER TABLE premium_videos
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Index for ordered listing
CREATE INDEX IF NOT EXISTS idx_premium_videos_sort_order
  ON premium_videos (sort_order ASC);

-- Back-fill existing rows: assign sort_order = row_number based on created_at
UPDATE premium_videos
SET sort_order = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1) * 10 AS rn
  FROM premium_videos
) sub
WHERE premium_videos.id = sub.id
  AND premium_videos.sort_order = 0;
