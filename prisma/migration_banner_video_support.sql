-- ============================================================
-- SPONSORED BANNERS: VIDEO SUPPORT + PRIORITY
-- ============================================================
-- Adds video_url, media_type, autoplay, display_duration, and priority columns to sponsored_banners

ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS autoplay BOOLEAN DEFAULT false;
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS display_duration INT NOT NULL DEFAULT 10;
ALTER TABLE sponsored_banners ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
