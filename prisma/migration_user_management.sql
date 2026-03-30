-- Migration: User account management (deletion requests, scheduled deletion)
-- Run this in Supabase SQL Editor

-- 1. Add deletion request columns (if not already present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deletion_requested_at') THEN
    ALTER TABLE users ADD COLUMN deletion_requested_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deletion_scheduled_at') THEN
    ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deletion_reason') THEN
    ALTER TABLE users ADD COLUMN deletion_reason TEXT;
  END IF;
END $$;

-- 2. Index for scheduled deletions (cron job will scan this)
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
  ON users (deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL AND deleted_at IS NULL;

-- 3. Function: user requests account deletion (7-day countdown)
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_scheduled TIMESTAMPTZ;
BEGIN
  -- Check if already requested
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND deletion_requested_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Deletion already requested';
  END IF;

  v_scheduled := NOW() + INTERVAL '7 days';

  UPDATE users
  SET deletion_requested_at = NOW(),
      deletion_scheduled_at = v_scheduled,
      deletion_reason = p_reason
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'requested_at', NOW(),
    'scheduled_at', v_scheduled,
    'can_cancel_until', NOW() + INTERVAL '5 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: cancel deletion request (only if within 5 days)
CREATE OR REPLACE FUNCTION cancel_account_deletion(
  p_user_id UUID,
  p_admin_override BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
DECLARE
  v_requested_at TIMESTAMPTZ;
BEGIN
  SELECT deletion_requested_at INTO v_requested_at
  FROM users WHERE id = p_user_id;

  IF v_requested_at IS NULL THEN
    RAISE EXCEPTION 'No deletion request found';
  END IF;

  -- Users can only cancel within 5 days; admins can always cancel
  IF NOT p_admin_override AND (NOW() - v_requested_at) > INTERVAL '5 days' THEN
    RAISE EXCEPTION 'Cancellation period expired. Contact support.';
  END IF;

  UPDATE users
  SET deletion_requested_at = NULL,
      deletion_scheduled_at = NULL,
      deletion_reason = NULL
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: permanently delete user data (called by cron or admin after 7 days)
CREATE OR REPLACE FUNCTION permanently_delete_user(p_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  -- Delete wallet data
  DELETE FROM wallet_transactions WHERE user_id = p_user_id;
  DELETE FROM wallet_deposit_addresses WHERE user_id = p_user_id;
  DELETE FROM wallet_withdrawals WHERE user_id = p_user_id;
  DELETE FROM wallet_accounts WHERE user_id = p_user_id;

  -- Delete premium data
  DELETE FROM premium_subscriptions WHERE user_id = p_user_id;

  -- Delete comments, likes
  DELETE FROM comments WHERE user_id = p_user_id;
  DELETE FROM likes WHERE user_id = p_user_id;

  -- Delete notifications
  DELETE FROM notifications WHERE user_id = p_user_id;

  -- Delete user row (will cascade remaining FKs)
  DELETE FROM users WHERE id = p_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function: process scheduled deletions (run via cron daily)
CREATE OR REPLACE FUNCTION process_scheduled_deletions() RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN
    SELECT id FROM users
    WHERE deletion_scheduled_at IS NOT NULL
      AND deletion_scheduled_at <= NOW()
      AND deleted_at IS NULL
  LOOP
    PERFORM permanently_delete_user(v_user.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
