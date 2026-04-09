-- =============================================================
-- Migration: Add youtube_id / stream columns to podcasts & live_streams
--            + Seed page_banner settings in site_settings
-- Run this in Supabase SQL editor
-- =============================================================

-- 1. podcasts: add youtube_id if missing
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS youtube_id TEXT;

-- 2. live_streams: add youtube_id, stream_url, stream_type if missing
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS youtube_id  TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS stream_url  TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS stream_type TEXT DEFAULT 'youtube';

-- 3. If site_settings table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'site_settings' AND policyname = 'Public read site_settings'
  ) THEN
    CREATE POLICY "Public read site_settings"
      ON site_settings FOR SELECT USING (true);
  END IF;
END $$;

-- Allow service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'site_settings' AND policyname = 'Service role manages site_settings'
  ) THEN
    CREATE POLICY "Service role manages site_settings"
      ON site_settings FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 4. Seed default banners (will not override existing ones)
INSERT INTO site_settings (key, value) VALUES
  ('podcast_banner', '{"type":"image","url":"","title":"Podcasts","subtitle":"Découvrez nos derniers épisodes et séries"}'::jsonb),
  ('live_banner',    '{"type":"image","url":"","title":"Lives","subtitle":"Regardez les streams en direct"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
