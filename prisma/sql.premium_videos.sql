-- ============================================================
-- Premium Videos Table
-- Stores metadata for videos uploaded to Cloudflare R2
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS premium_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- R2 storage keys (NOT full URLs – URLs are generated server-side)
  video_key_480p  TEXT,                -- videos/480p/filename.mp4
  video_key_720p  TEXT,                -- videos/720p/filename.mp4
  video_key_1080p TEXT,                -- videos/1080p/filename.mp4
  thumbnail_key   TEXT NOT NULL,       -- Sidra Miniature/filename.jpg

  -- Metadata
  duration        INTEGER DEFAULT 0,   -- seconds
  file_size       BIGINT DEFAULT 0,    -- bytes (largest quality)
  quality_options TEXT[] DEFAULT ARRAY['720p']::TEXT[],  -- available qualities

  -- Access control
  is_premium      BOOLEAN DEFAULT TRUE,
  min_plan        TEXT DEFAULT 'pro' CHECK (min_plan IN ('pro', 'premium', 'vip')),

  -- Stats
  views           INTEGER DEFAULT 0,
  likes           INTEGER DEFAULT 0,

  -- Audit
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_videos_category ON premium_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_premium_videos_premium  ON premium_videos(is_premium);
CREATE INDEX IF NOT EXISTS idx_premium_videos_created  ON premium_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_videos_views    ON premium_videos(views DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_premium_videos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_premium_videos_updated ON premium_videos;
CREATE TRIGGER trg_premium_videos_updated
  BEFORE UPDATE ON premium_videos
  FOR EACH ROW EXECUTE FUNCTION update_premium_videos_timestamp();

-- Increment views helper
CREATE OR REPLACE FUNCTION increment_premium_video_views(vid UUID)
RETURNS void AS $$
BEGIN
  UPDATE premium_videos SET views = views + 1 WHERE id = vid;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE premium_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can read video metadata (thumbnails are public)
CREATE POLICY "premium_videos_select" ON premium_videos
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "premium_videos_admin_insert" ON premium_videos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "premium_videos_admin_update" ON premium_videos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "premium_videos_admin_delete" ON premium_videos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
