-- ============================================================
-- FIX: process_referral_reward — notes → description
-- The wallet_transactions table has no column named "notes".
-- The correct column is "description".
-- Run once in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referred_id UUID,
  p_reason      TEXT DEFAULT 'subscription'
) RETURNS VOID AS $$
DECLARE
  v_referral         RECORD;
  v_settings         RECORD;
  v_referrer_premium BOOLEAN;
  v_reward_amount    NUMERIC;
  v_total_earned     NUMERIC;
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

  -- Credit wallet of referrer (description, not notes)
  INSERT INTO wallet_transactions (
    user_id, type, direction, amount, fee, status, network, description
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

  -- Notify referrer
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
