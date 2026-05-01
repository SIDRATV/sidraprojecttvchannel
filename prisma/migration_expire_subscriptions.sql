-- ============================================================
-- Auto-expiry of premium subscriptions
-- 1. Function to expire all past-due active subscriptions
-- 2. Scheduled via pg_cron (if enabled) or call manually
-- Run once to create the function; pg_cron line optional.
-- ============================================================

-- Function: marks active subscriptions as 'expired' and clears
-- the premium_plan / premium_expires_at fields on the users table.
CREATE OR REPLACE FUNCTION expire_premium_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- 1. Mark subscriptions as expired
  WITH expired AS (
    UPDATE premium_subscriptions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING user_id
  ),
  -- 2. Clear premium fields on affected users only if they
  --    have no other active, non-expired subscription
  users_to_clear AS (
    SELECT DISTINCT e.user_id
    FROM expired e
    WHERE NOT EXISTS (
      SELECT 1 FROM premium_subscriptions ps
      WHERE ps.user_id = e.user_id
        AND ps.status = 'active'
        AND ps.expires_at >= NOW()
    )
  )
  UPDATE users u
  SET
    premium_plan             = NULL,
    premium_expires_at       = NULL,
    premium_subscription_id  = NULL
  FROM users_to_clear utc
  WHERE u.id = utc.user_id;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RAISE NOTICE 'expire_premium_subscriptions: % users cleared', expired_count;
END;
$$;

-- Grant execute to service role so Next.js API routes can call it
GRANT EXECUTE ON FUNCTION expire_premium_subscriptions() TO service_role;

-- ── Optional: schedule via pg_cron (requires pg_cron extension) ──
-- Uncomment if pg_cron is enabled on your Supabase project:
--
-- SELECT cron.schedule(
--   'expire-premium-subscriptions',   -- job name
--   '0 * * * *',                       -- every hour
--   $$SELECT expire_premium_subscriptions();$$
-- );
