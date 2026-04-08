-- ============================================================
-- PARTNERSHIP PRICING & SPONSORED BANNERS SYSTEM
-- ============================================================

-- Table: partnership_pricing — admin-defined prices for partnership types
CREATE TABLE IF NOT EXISTS partnership_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_type TEXT NOT NULL CHECK (partnership_type IN ('advertising', 'project')),
  duration_type TEXT NOT NULL CHECK (duration_type IN ('weekly', 'monthly', 'yearly')),
  price_sidra NUMERIC(18,4) NOT NULL DEFAULT 0,
  price_sptc NUMERIC(18,4) NOT NULL DEFAULT 0,
  price_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partnership_type, duration_type)
);

-- Table: partnership_payments — tracks payments for applications
CREATE TABLE IF NOT EXISTS partnership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES partnership_applications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pricing_id UUID REFERENCES partnership_pricing(id) ON DELETE SET NULL,
  amount NUMERIC(18,4) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('sidra', 'sptc', 'visa')),
  duration_type TEXT NOT NULL CHECK (duration_type IN ('weekly', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  refund_reason TEXT DEFAULT '',
  transaction_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sponsored_banners — banners/ads displayed on the platform
CREATE TABLE IF NOT EXISTS sponsored_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES partnership_applications(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT DEFAULT '',
  banner_type TEXT NOT NULL DEFAULT 'large' CHECK (banner_type IN ('large', 'medium', 'small')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add payment-related columns to partnership_applications
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES partnership_payments(id) ON DELETE SET NULL;
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'monthly' CHECK (duration_type IN ('weekly', 'monthly', 'yearly'));
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT '';
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(18,4) DEFAULT 0;
ALTER TABLE partnership_applications ADD COLUMN IF NOT EXISTS correction_note TEXT DEFAULT '';

-- Update status check to include 'correction_needed'
ALTER TABLE partnership_applications DROP CONSTRAINT IF EXISTS partnership_applications_status_check;
ALTER TABLE partnership_applications ADD CONSTRAINT partnership_applications_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'correction_needed'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partnership_pricing_type ON partnership_pricing(partnership_type);
CREATE INDEX IF NOT EXISTS idx_partnership_payments_user ON partnership_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_partnership_payments_app ON partnership_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_banners_active ON sponsored_banners(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_sponsored_banners_partner ON sponsored_banners(partner_id);

-- RLS
ALTER TABLE partnership_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_banners ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing
CREATE POLICY "pricing_select" ON partnership_pricing FOR SELECT USING (true);
CREATE POLICY "pricing_admin_all" ON partnership_pricing FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Users can see own payments, admins can see all
CREATE POLICY "payments_select" ON partnership_payments FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "payments_insert" ON partnership_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_admin_update" ON partnership_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Everyone can see active banners, admins manage all
CREATE POLICY "banners_select" ON sponsored_banners FOR SELECT USING (true);
CREATE POLICY "banners_admin_all" ON sponsored_banners FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Seed default pricing if empty
INSERT INTO partnership_pricing (partnership_type, duration_type, price_sidra, price_sptc, price_usd) VALUES
  ('project', 'weekly', 100, 50, 10),
  ('project', 'monthly', 350, 175, 35),
  ('project', 'yearly', 3500, 1750, 350),
  ('advertising', 'weekly', 200, 100, 20),
  ('advertising', 'monthly', 700, 350, 70),
  ('advertising', 'yearly', 7000, 3500, 700)
ON CONFLICT (partnership_type, duration_type) DO NOTHING;
