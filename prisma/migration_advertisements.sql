-- ============================================================
-- ADVERTISEMENTS (ADS) MODULE — Completely separate from partnerships
-- ============================================================

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT DEFAULT '',
  ad_type TEXT NOT NULL DEFAULT 'banner' CHECK (ad_type IN ('banner', 'popup', 'video', 'other')),
  media_url TEXT DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  redirect_url TEXT DEFAULT '',
  duration_days INT NOT NULL DEFAULT 7,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'sidra' CHECK (currency IN ('sidra', 'sptc', 'visa')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'rejected', 'expired', 'paused')),
  reject_reason TEXT DEFAULT '',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_ref TEXT DEFAULT '',
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad pricing table
CREATE TABLE IF NOT EXISTS ad_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type TEXT NOT NULL,
  duration_days INT NOT NULL,
  price_sidra DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_sptc DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advertisements_user_id ON advertisements(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_ad_type ON advertisements(ad_type);

-- Seed default ad pricing
INSERT INTO ad_pricing (ad_type, duration_days, price_sidra, price_sptc, price_usd) VALUES
  ('banner', 1, 50, 5, 2),
  ('banner', 7, 200, 20, 10),
  ('banner', 30, 500, 50, 30),
  ('popup', 1, 80, 8, 4),
  ('popup', 7, 350, 35, 18),
  ('popup', 30, 900, 90, 50),
  ('video', 1, 100, 10, 5),
  ('video', 7, 500, 50, 25),
  ('video', 30, 1500, 150, 80)
ON CONFLICT DO NOTHING;

-- RLS policies
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_pricing ENABLE ROW LEVEL SECURITY;

-- Public can read active ads
CREATE POLICY "Public can view active ads" ON advertisements FOR SELECT USING (status = 'active');
-- Users can view their own ads
CREATE POLICY "Users can view own ads" ON advertisements FOR SELECT USING (auth.uid() = user_id);
-- Users can insert their own ads
CREATE POLICY "Users can create ads" ON advertisements FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Service role full access (for admin)
CREATE POLICY "Service role full access ads" ON advertisements FOR ALL USING (true) WITH CHECK (true);

-- Ad pricing read for everyone
CREATE POLICY "Public can read ad pricing" ON ad_pricing FOR SELECT USING (true);
CREATE POLICY "Service role full access ad_pricing" ON ad_pricing FOR ALL USING (true) WITH CHECK (true);
