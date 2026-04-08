-- ============================================================
-- SPONSORED BANNERS: VIDEO SUPPORT
-- ============================================================
-- Adds video_url, media_type, and autoplay columns to sponsored_banners

ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS autoplay BOOLEAN DEFAULT false;
