-- ============================================================
-- PREMIUM SUBSCRIPTION SYSTEM — Full Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Premium plan pricing (admin-configurable)
CREATE TABLE IF NOT EXISTS premium_plans (
  id TEXT PRIMARY KEY,                       -- 'pro', 'premium', 'vip'
  name TEXT NOT NULL,
  price_monthly NUMERIC(12,4) NOT NULL DEFAULT 0,
  price_quarterly NUMERIC(12,4) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SIDRA',
  features JSONB NOT NULL DEFAULT '[]',      -- array of feature strings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO premium_plans (id, name, price_monthly, price_quarterly, price_yearly, features, sort_order)
VALUES
  ('pro',     'Pro',     9.99,  24.99,  89.99,  '["Up to 1080p streaming","Download 5 videos/month","Early access (24h)","100 SPTC/month","Basic analytics"]', 1),
  ('premium', 'Premium', 19.99, 49.99,  179.99, '["4K Ultra HD streaming","Unlimited downloads","Early access (48h)","200 SPTC/month","Ad-free experience","VIP Creator access","Advanced analytics","Paid surveys","Basic referral program"]', 2),
  ('vip',     'VIP',     29.99, 74.99,  269.99, '["All Premium features","4K + Lossless audio","VIP events access","300 SPTC/month","Private creator sessions","Investor insights","24/7 support","Advanced paid surveys","Premium referral (+50% bonus)","Exclusive content"]', 3)
ON CONFLICT (id) DO NOTHING;

-- 2. User subscriptions
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES premium_plans(id),
  duration TEXT NOT NULL CHECK (duration IN ('monthly','quarterly','yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','fraud')),
  amount_paid NUMERIC(12,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SIDRA',
  payment_method TEXT NOT NULL DEFAULT 'wallet',  -- 'wallet', 'sptc', 'visa'
  discount_code TEXT,
  discount_amount NUMERIC(12,4) DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_subs_user ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subs_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subs_expires ON premium_subscriptions(expires_at);

-- 3. Discount / promo codes
CREATE TABLE IF NOT EXISTS premium_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  plan_restriction TEXT,                     -- NULL = all plans, or 'pro'/'premium'/'vip'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_code ON premium_discount_codes(code);

-- 4. Discount code usage log
CREATE TABLE IF NOT EXISTS premium_discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES premium_discount_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id UUID REFERENCES premium_subscriptions(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON premium_discount_usage(user_id);

-- 5. Fraud / security alerts
CREATE TABLE IF NOT EXISTS premium_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL,                  -- 'duplicate_sub','rapid_cancel','code_abuse','balance_manipulation'
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  details JSONB DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user ON premium_fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved ON premium_fraud_alerts(resolved);

-- 6. Add premium fields to users table (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='premium_plan') THEN
    ALTER TABLE users ADD COLUMN premium_plan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='premium_expires_at') THEN
    ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='premium_subscription_id') THEN
    ALTER TABLE users ADD COLUMN premium_subscription_id UUID;
  END IF;
END $$;

-- 7. RLS policies
ALTER TABLE premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read plans
CREATE POLICY IF NOT EXISTS "Anyone can read plans" ON premium_plans FOR SELECT USING (true);

-- Users can read their own subscriptions
CREATE POLICY IF NOT EXISTS "Users read own subs" ON premium_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 8. Function: subscribe to premium (atomic — deducts balance + creates subscription)
CREATE OR REPLACE FUNCTION premium_subscribe(
  p_user_id UUID,
  p_plan_id TEXT,
  p_duration TEXT,
  p_amount NUMERIC,
  p_discount_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_sub_id UUID;
  v_balance NUMERIC;
  v_expires TIMESTAMPTZ;
  v_existing_active INT;
BEGIN
  -- Check for existing active subscription
  SELECT COUNT(*) INTO v_existing_active
  FROM premium_subscriptions
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > NOW();

  IF v_existing_active > 0 THEN
    RAISE EXCEPTION 'User already has an active premium subscription';
  END IF;

  -- Check balance
  SELECT balance INTO v_balance
  FROM wallet_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: %, Available: %', p_amount, COALESCE(v_balance, 0);
  END IF;

  -- Calculate expiration
  v_expires := CASE p_duration
    WHEN 'monthly'   THEN NOW() + INTERVAL '1 month'
    WHEN 'quarterly'  THEN NOW() + INTERVAL '3 months'
    WHEN 'yearly'     THEN NOW() + INTERVAL '1 year'
    ELSE NOW() + INTERVAL '1 month'
  END;

  -- Deduct balance
  UPDATE wallet_accounts
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create subscription
  INSERT INTO premium_subscriptions (user_id, plan_id, duration, amount_paid, discount_code, discount_amount, expires_at)
  VALUES (p_user_id, p_plan_id, p_duration, p_amount, p_discount_code, p_discount_amount, v_expires)
  RETURNING id INTO v_sub_id;

  -- Record wallet transaction
  INSERT INTO wallet_transactions (user_id, type, direction, amount, fee, status, description, reference_id)
  VALUES (p_user_id, 'subscription', 'out', p_amount, 0, 'completed',
          'Premium subscription: ' || p_plan_id || ' (' || p_duration || ')',
          'sub_' || v_sub_id::TEXT);

  -- Update user profile
  UPDATE users
  SET premium_plan = p_plan_id, premium_expires_at = v_expires, premium_subscription_id = v_sub_id
  WHERE id = p_user_id;

  RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function: check & expire subscriptions (call via cron)
CREATE OR REPLACE FUNCTION premium_expire_check() RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE premium_subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE users
  SET premium_plan = NULL, premium_expires_at = NULL, premium_subscription_id = NULL
  WHERE premium_expires_at < NOW() AND premium_plan IS NOT NULL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
