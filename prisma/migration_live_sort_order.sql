-- Migration: add sort_order column to live_streams
-- Run this in the Supabase SQL editor

ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialise sort_order based on existing created_at order (oldest = lowest index)
UPDATE live_streams
SET sort_order = sub.rn * 10
FROM (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1) AS rn
  FROM live_streams
) sub
WHERE live_streams.id = sub.id;
