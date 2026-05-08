-- ============================================================
-- FIX: process_referral_reward
--   1. Credits wallet_accounts.balance (was missing — only logged transaction)
--   2. Adds anti-abuse protections:
--      - Self-referral block
--      - Max 2 rewards per referred user per 24h (prevents renewal abuse)
--      - Idempotency key on wallet_transactions (prevents double-credit)
--      - Premium expiry check for referrer (must have ACTIVE premium)
-- Run once in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referred_id UUID,
  p_reason      TEXT DEFAULT 'subscription'
) RETURNS VOID AS $$
DECLARE
  v_referral          RECORD;
  v_settings          RECORD;
  v_referrer_premium  BOOLEAN;
  v_reward_amount     NUMERIC;
  v_total_earned      NUMERIC;
  v_rewards_today     INT;
  v_ref_id            TEXT;
BEGIN

  -- ── Anti-abuse 1: max 2 rewards per referred user per 24 hours ─────────────
  SELECT COUNT(*) INTO v_rewards_today
  FROM referral_rewards
  WHERE referred_id = p_referred_id
    AND created_at > NOW() - INTERVAL '24 hours';
  IF v_rewards_today >= 2 THEN RETURN; END IF;

  -- ── Get referral record ────────────────────────────────────────────────────
  SELECT * INTO v_referral FROM referrals
  WHERE referred_id = p_referred_id
    AND status IN ('pending', 'active');
  IF NOT FOUND THEN RETURN; END IF;

  -- ── Anti-abuse 2: block self-referral ──────────────────────────────────────
  IF v_referral.referrer_id = p_referred_id THEN RETURN; END IF;

  -- ── Get settings ───────────────────────────────────────────────────────────
  SELECT * INTO v_settings FROM referral_settings WHERE is_active = TRUE LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- ── Check referrer has ACTIVE premium (expiry included) ────────────────────
  IF v_settings.require_premium_to_earn THEN
    SELECT (
      premium_plan IS NOT NULL
      AND premium_plan != ''
      AND premium_plan != 'free'
      AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    ) INTO v_referrer_premium
    FROM users WHERE id = v_referral.referrer_id;
    IF NOT COALESCE(v_referrer_premium, FALSE) THEN RETURN; END IF;
  END IF;

  -- ── Determine reward amount ────────────────────────────────────────────────
  IF p_reason = 'renewal' THEN
    v_reward_amount := v_settings.reward_per_renewal;
  ELSE
    v_reward_amount := v_settings.reward_per_subscription;
  END IF;

  -- ── Check lifetime cap ─────────────────────────────────────────────────────
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM referral_rewards WHERE referral_id = v_referral.id;
  IF v_total_earned + v_reward_amount > v_settings.max_reward_per_referral THEN
    v_reward_amount := GREATEST(0, v_settings.max_reward_per_referral - v_total_earned);
  END IF;
  IF v_reward_amount <= 0 THEN RETURN; END IF;

  -- ── Idempotency: one reward per referral+reason per calendar day ───────────
  v_ref_id := 'ref_' || v_referral.id::TEXT || '_' || p_reason || '_'
              || TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  IF EXISTS (
    SELECT 1 FROM wallet_transactions WHERE reference_id = v_ref_id
  ) THEN RETURN; END IF;

  -- ── Update referral status ─────────────────────────────────────────────────
  UPDATE referrals
  SET status       = 'active',
      activated_at = COALESCE(activated_at, NOW())
  WHERE id = v_referral.id;

  -- ── Log reward ─────────────────────────────────────────────────────────────
  INSERT INTO referral_rewards (referral_id, referrer_id, referred_id, amount, reason)
  VALUES (v_referral.id, v_referral.referrer_id, p_referred_id, v_reward_amount, p_reason);

  -- ── Log wallet transaction ─────────────────────────────────────────────────
  INSERT INTO wallet_transactions (
    user_id, type, direction, amount, fee, status, network, description, reference_id
  ) VALUES (
    v_referral.referrer_id, 'referral', 'credit',
    v_reward_amount, 0, 'completed', 'internal',
    'Bonus parrainage: ' || p_reason, v_ref_id
  );

  -- ── CRITICAL FIX: Credit wallet_accounts.balance ──────────────────────────
  INSERT INTO wallet_accounts (user_id, balance, currency)
  VALUES (v_referral.referrer_id, v_reward_amount, 'SIDRA')
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = wallet_accounts.balance + EXCLUDED.balance,
        updated_at = NOW();

  -- ── Notify referrer ────────────────────────────────────────────────────────
  PERFORM create_notification(
    v_referral.referrer_id, 'referral',
    '🎁 Bonus parrainage reçu!',
    'Vous avez reçu ' || v_reward_amount::TEXT || ' SIDRA pour votre parrainage.',
    'gift', '/wallet'
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Anti-abuse 3: block self-click on referral link ────────────────────────
CREATE OR REPLACE FUNCTION increment_referral_clicks(p_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT user_id INTO v_owner_id FROM referral_codes WHERE code = p_code;
  -- Skip if the owner is clicking their own link
  IF v_owner_id IS NOT NULL AND v_owner_id = auth.uid() THEN RETURN; END IF;
  UPDATE referral_codes SET total_clicks = total_clicks + 1 WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


SELECT 'Referral wallet fix + anti-abuse migration complete' AS status;

