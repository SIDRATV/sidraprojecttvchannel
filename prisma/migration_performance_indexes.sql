-- ============================================================
-- Performance Indexes Migration
-- Eliminates sequential scans (seq_scan) on high-traffic tables.
-- Run once against your Supabase PostgreSQL database.
-- All statements are idempotent (CREATE INDEX IF NOT EXISTS).
-- ============================================================

-- ── wallet_deposit_addresses ──────────────────────────────────
-- Used by scanner to look up deposit owner by blockchain address
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_addresses_address
  ON wallet_deposit_addresses (address);

-- Used by scanner to fetch active addresses per network
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_addresses_active_network
  ON wallet_deposit_addresses (is_active, network)
  WHERE is_active = true;

-- ── wallet_transactions ───────────────────────────────────────
-- Used by every balance query, transaction history fetch, and pending-deposit check
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id
  ON wallet_transactions (user_id);

-- Used by scanner confirmPendingDeposits: .eq('type','deposit').eq('status','pending').eq('network',...)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type_status_network
  ON wallet_transactions (type, status, network);

-- Used by pending-deposit API: filter by user_id + type + status
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_type_status
  ON wallet_transactions (user_id, type, status);

-- Used by duplicate-detection lookup: .eq('tx_hash',...).eq('type','deposit')
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash
  ON wallet_transactions (tx_hash)
  WHERE tx_hash IS NOT NULL;

-- ── wallet_withdrawals ────────────────────────────────────────
-- Used by withdrawal processor to fetch pending/queued withdrawals
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status
  ON wallet_withdrawals (status);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_id
  ON wallet_withdrawals (user_id);

-- ── wallet_accounts ───────────────────────────────────────────
-- Primary key already indexed; add this for user_id lookups (upsert/select)
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user_id
  ON wallet_accounts (user_id);

-- ── sessions (auth schema) ────────────────────────────────────
-- Supabase manages auth.sessions internally; skip if you don't own that schema.
-- If you have a public.sessions table, uncomment the line below:
-- CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- ── wallet_audit_logs ─────────────────────────────────────────
-- Frequently queried by admin monitoring route
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_actor_user_id
  ON wallet_audit_logs (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_action
  ON wallet_audit_logs (action);

-- ── Realtime publication ──────────────────────────────────────
-- Ensure wallet_accounts and wallet_transactions are in the realtime publication
-- so Supabase Realtime can broadcast row-level changes to subscribed clients.
-- (Safe to run even if already added — INSERT into supabase_realtime.subscription is idempotent)

DO $$
BEGIN
  -- Add wallet_accounts to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallet_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_accounts;
  END IF;

  -- Add wallet_transactions to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallet_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
  END IF;
END;
$$;
