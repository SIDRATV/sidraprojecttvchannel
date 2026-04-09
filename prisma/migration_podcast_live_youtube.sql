-- =============================================================
-- Migration: Create podcasts & live_streams tables (if not exist)
--            + Add youtube_id / stream columns
--            + Seed page_banner settings in site_settings
-- Run this in Supabase SQL editor
-- =============================================================

-- 0a. Create podcasts table if it doesn't exist
CREATE TABLE IF NOT EXISTS podcasts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  youtube_id  TEXT,
  duration    TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  creator     TEXT NOT NULL,
  views       INTEGER DEFAULT 0,
  likes       INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='podcasts' AND policyname='Podcasts are publicly readable') THEN
    CREATE POLICY "Podcasts are publicly readable" ON podcasts FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='podcasts' AND policyname='Service role manages podcasts') THEN
    CREATE POLICY "Service role manages podcasts" ON podcasts FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 0b. Create live_streams table if it doesn't exist
CREATE TABLE IF NOT EXISTS live_streams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  youtube_id  TEXT,
  stream_url  TEXT,
  stream_type TEXT DEFAULT 'youtube',
  viewers     INTEGER DEFAULT 0,
  category    TEXT NOT NULL,
  streamer    TEXT NOT NULL,
  is_live     BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_streams' AND policyname='Live streams are publicly readable') THEN
    CREATE POLICY "Live streams are publicly readable" ON live_streams FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='live_streams' AND policyname='Service role manages live_streams') THEN
    CREATE POLICY "Service role manages live_streams" ON live_streams FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 1. podcasts: add columns if table existed before without them
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS youtube_id  TEXT;
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now();

-- 2. live_streams: add columns if table existed before without them
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS youtube_id  TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS stream_url  TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS stream_type TEXT DEFAULT 'youtube';
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now();

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
