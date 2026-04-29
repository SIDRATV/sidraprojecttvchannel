-- ============================================================
-- REFERRAL / AFFILIATE SYSTEM
-- Run in Supabase SQL Editor in order
-- ============================================================

-- 1. Referral codes table (one per user, generated at signup or on demand)
CREATE TABLE IF NOT EXISTS referral_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,              -- e.g. "sidra_abc123"
  total_clicks INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user   ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code   ON referral_codes(code);

-- 2. Referrals table (tracks who referred whom)
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','inactive')),
  -- 'pending'  = referred user signed up but no premium yet
  -- 'active'   = referred user has/had premium (referrer can earn)
  -- 'inactive' = referred user cancelled and never renewed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at    TIMESTAMPTZ                        -- when first premium activated
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- 3. Referral rewards table (log of earned bonuses)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id  UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  referrer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC(18,8) NOT NULL,
  reason       TEXT NOT NULL DEFAULT 'subscription', -- 'signup' | 'subscription' | 'renewal'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);

-- 4. Referral settings (admin-configurable)
CREATE TABLE IF NOT EXISTS referral_settings (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_per_subscription    NUMERIC(18,8) NOT NULL DEFAULT 10,   -- SIDRA per new sub
  reward_per_renewal         NUMERIC(18,8) NOT NULL DEFAULT 5,    -- SIDRA per renewal
  require_premium_to_earn    BOOLEAN NOT NULL DEFAULT TRUE,        -- referrer must be premium
  max_reward_per_referral    NUMERIC(18,8) NOT NULL DEFAULT 500,  -- lifetime cap per referred user
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                 UUID REFERENCES auth.users(id)
);

-- Insert default settings if not exists
INSERT INTO referral_settings (
  reward_per_subscription, reward_per_renewal,
  require_premium_to_earn, max_reward_per_referral, is_active
)
SELECT 10, 5, TRUE, 500, TRUE
WHERE NOT EXISTS (SELECT 1 FROM referral_settings);

-- 5. RLS
ALTER TABLE referral_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- referral_codes: user sees own code
DROP POLICY IF EXISTS "user_own_code" ON referral_codes;
CREATE POLICY "user_own_code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- referral_codes: public can read code/user_id to validate (needed at signup)
DROP POLICY IF EXISTS "public_read_code" ON referral_codes;
CREATE POLICY "public_read_code" ON referral_codes
  FOR SELECT USING (TRUE);

-- referrals: user sees own referrals (as referrer)
DROP POLICY IF EXISTS "user_own_referrals" ON referrals;
CREATE POLICY "user_own_referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- referral_rewards: user sees own rewards
DROP POLICY IF EXISTS "user_own_rewards" ON referral_rewards;
CREATE POLICY "user_own_rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id);

-- referral_settings: all can read (to show rules)
DROP POLICY IF EXISTS "public_read_settings" ON referral_settings;
CREATE POLICY "public_read_settings" ON referral_settings
  FOR SELECT USING (TRUE);

-- 6. Function: generate unique referral code for a user
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_username TEXT;
  v_code     TEXT;
  v_exists   BOOLEAN;
  v_attempts INT := 0;
BEGIN
  -- Use existing code if already has one
  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  -- Get username for readable code
  SELECT username INTO v_username FROM users WHERE id = p_user_id;

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;

    -- Format: username_XXXX (or random if no username)
    IF v_username IS NOT NULL THEN
      v_code := lower(v_username) || '_' || substr(md5(random()::text), 1, 4);
    ELSE
      v_code := 'ref_' || substr(md5(p_user_id::text || random()::text), 1, 8);
    END IF;

    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: process referral reward when subscription activates/renews
CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referred_id UUID,
  p_reason      TEXT DEFAULT 'subscription'
) RETURNS VOID AS $$
DECLARE
  v_referral        RECORD;
  v_settings        RECORD;
  v_referrer_premium BOOLEAN;
  v_reward_amount   NUMERIC;
  v_total_earned    NUMERIC;
BEGIN
  -- Get referral record
  SELECT * INTO v_referral FROM referrals
  WHERE referred_id = p_referred_id
    AND status IN ('pending','active');
  IF NOT FOUND THEN RETURN; END IF;

  -- Get settings
  SELECT * INTO v_settings FROM referral_settings WHERE is_active = TRUE LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- Check if referrer has premium (if required)
  IF v_settings.require_premium_to_earn THEN
    SELECT (premium_plan IS NOT NULL AND premium_plan != 'free')
      INTO v_referrer_premium
      FROM users WHERE id = v_referral.referrer_id;
    IF NOT v_referrer_premium THEN RETURN; END IF;
  END IF;

  -- Determine reward amount
  IF p_reason = 'renewal' THEN
    v_reward_amount := v_settings.reward_per_renewal;
  ELSE
    v_reward_amount := v_settings.reward_per_subscription;
  END IF;

  -- Check lifetime cap
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM referral_rewards WHERE referral_id = v_referral.id;

  IF v_total_earned + v_reward_amount > v_settings.max_reward_per_referral THEN
    v_reward_amount := GREATEST(0, v_settings.max_reward_per_referral - v_total_earned);
  END IF;

  IF v_reward_amount <= 0 THEN RETURN; END IF;

  -- Update referral status to active
  UPDATE referrals SET status = 'active', activated_at = COALESCE(activated_at, NOW())
  WHERE id = v_referral.id;

  -- Log reward
  INSERT INTO referral_rewards (referral_id, referrer_id, referred_id, amount, reason)
  VALUES (v_referral.id, v_referral.referrer_id, p_referred_id, v_reward_amount, p_reason);

  -- Credit wallet of referrer (internal transfer)
  INSERT INTO wallet_transactions (
    user_id, type, direction, amount, fee, status, network, notes
  ) VALUES (
    v_referral.referrer_id,
    'referral',
    'credit',
    v_reward_amount,
    0,
    'completed',
    'internal',
    'Bonus parrainage: ' || p_reason
  );

  -- Create notification for referrer
  PERFORM create_notification(
    v_referral.referrer_id,
    'referral',
    '🎁 Bonus parrainage reçu!',
    'Vous avez reçu ' || v_reward_amount::TEXT || ' SIDRA pour votre parrainage.',
    'gift',
    '/premium-dashboard'
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: on new premium subscription → process referral reward
CREATE OR REPLACE FUNCTION trigger_referral_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_already_activated BOOLEAN;
BEGIN
  -- Only fire for NEW active subscriptions
  IF NEW.status != 'active' THEN RETURN NEW; END IF;

  -- Check if this is a renewal (referral already activated before)
  SELECT (activated_at IS NOT NULL) INTO v_already_activated
  FROM referrals WHERE referred_id = NEW.user_id;

  IF v_already_activated IS TRUE THEN
    PERFORM process_referral_reward(NEW.user_id, 'renewal');
  ELSIF v_already_activated IS FALSE THEN
    PERFORM process_referral_reward(NEW.user_id, 'subscription');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_referral_subscription ON premium_subscriptions;
CREATE TRIGGER trigger_referral_subscription
  AFTER INSERT OR UPDATE OF status ON premium_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION trigger_referral_on_subscription();

-- 9. Add 'referral' to wallet_transaction_type enum if not exists
ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'referral';

-- 10. Add 'referral' to notifications type check
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_video','transaction','subscription','system','referral','promo'));

-- Done
SELECT 'Referral system migration complete' AS status;
