-- ============================================================
-- NOTIFICATIONS SYSTEM + ENUM FIX — Run in Supabase SQL Editor
-- ============================================================

-- 1. Fix wallet_transaction_type enum: add 'subscription' value
ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'subscription';

-- 2. Fix wallet_transaction_direction enum: add 'out' and 'in' values
ALTER TYPE wallet_transaction_direction ADD VALUE IF NOT EXISTS 'out';
ALTER TYPE wallet_transaction_direction ADD VALUE IF NOT EXISTS 'in';

-- 3. Fix wallet_transaction_status enum: add 'completed' value
ALTER TYPE wallet_transaction_status ADD VALUE IF NOT EXISTS 'completed';

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_video','transaction','subscription','system','referral','promo')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'bell',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 5. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 6. User notification preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notifications_enabled') THEN
    ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 7. Function: create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT 'bell',
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_enabled BOOLEAN;
BEGIN
  SELECT COALESCE(notifications_enabled, TRUE) INTO v_enabled
  FROM users WHERE id = p_user_id;

  IF NOT v_enabled THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, title, message, icon, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_icon, p_link)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: broadcast notification to all users
CREATE OR REPLACE FUNCTION broadcast_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT 'bell',
  p_link TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, icon, link)
  SELECT id, p_type, p_title, p_message, p_icon, p_link
  FROM users
  WHERE COALESCE(notifications_enabled, TRUE) = TRUE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update premium_subscribe to also create a notification
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
  v_plan_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_existing_active
  FROM premium_subscriptions
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > NOW();

  IF v_existing_active > 0 THEN
    RAISE EXCEPTION 'User already has an active premium subscription';
  END IF;

  SELECT name INTO v_plan_name FROM premium_plans WHERE id = p_plan_id;

  SELECT balance INTO v_balance
  FROM wallet_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: %, Available: %', p_amount, COALESCE(v_balance, 0);
  END IF;

  v_expires := CASE p_duration
    WHEN 'monthly'   THEN NOW() + INTERVAL '1 month'
    WHEN 'quarterly'  THEN NOW() + INTERVAL '3 months'
    WHEN 'yearly'     THEN NOW() + INTERVAL '1 year'
    ELSE NOW() + INTERVAL '1 month'
  END;

  UPDATE wallet_accounts
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO premium_subscriptions (user_id, plan_id, duration, amount_paid, discount_code, discount_amount, expires_at)
  VALUES (p_user_id, p_plan_id, p_duration, p_amount, p_discount_code, p_discount_amount, v_expires)
  RETURNING id INTO v_sub_id;

  INSERT INTO wallet_transactions (user_id, type, direction, amount, fee, status, description, reference_id)
  VALUES (p_user_id, 'subscription', 'out', p_amount, 0, 'completed',
          'Premium subscription: ' || p_plan_id || ' (' || p_duration || ')',
          'sub_' || v_sub_id::TEXT);

  UPDATE users
  SET premium_plan = p_plan_id, premium_expires_at = v_expires, premium_subscription_id = v_sub_id
  WHERE id = p_user_id;

  -- Create notification for the subscriber
  PERFORM create_notification(
    p_user_id,
    'subscription',
    'Abonnement ' || COALESCE(v_plan_name, p_plan_id) || ' activé',
    'Votre abonnement ' || p_duration || ' est actif jusqu''au ' || to_char(v_expires, 'DD/MM/YYYY') || '. Montant: ' || p_amount || ' SIDRA',
    'crown',
    '/premium-dashboard'
  );

  RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
