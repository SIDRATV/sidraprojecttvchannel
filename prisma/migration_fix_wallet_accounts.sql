-- ============================================================
-- COMPLETE WALLET MIGRATION
--
-- Run in Supabase Dashboard → SQL Editor → paste & run
--
-- This script:
-- 1. Drops conflicting exchange-schema wallet tables
-- 2. Recreates wallet_accounts with the correct schema
-- 3. Ensures wallet_transactions / withdrawals / limits /
--    deposit_addresses / audit_logs all exist
-- 4. Creates all RPC functions (transfer, deposit, withdrawal)
-- 5. Sets up auto-provision trigger on users table
-- 6. Drops the memo column from deposit_addresses if present
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────
-- 1. helper function for updated_at triggers
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────
-- 2. Drop exchange-schema tables that conflict
-- ────────────────────────────────────────────────────────
-- The exchange schema used network+address based wallet_accounts,
-- wallet_balances, wallet_deposits — none of which match the app.
DROP TABLE IF EXISTS wallet_balances CASCADE;
DROP TABLE IF EXISTS wallet_deposits CASCADE;

-- wallet_accounts must be recreated (different column set)
DROP TABLE IF EXISTS wallet_accounts CASCADE;

-- ────────────────────────────────────────────────────────
-- 3. Enum types (safe create)
-- ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type') THEN
    CREATE TYPE wallet_transaction_type AS ENUM (
      'internal_transfer', 'withdrawal', 'deposit', 'fee', 'adjustment'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_direction') THEN
    CREATE TYPE wallet_transaction_direction AS ENUM ('credit', 'debit');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_status') THEN
    CREATE TYPE wallet_transaction_status AS ENUM ('pending', 'success', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_withdrawal_status') THEN
    CREATE TYPE wallet_withdrawal_status AS ENUM ('pending', 'processing', 'success', 'failed');
  END IF;
END $$;

-- ────────────────────────────────────────────────────────
-- 4. Core tables
-- ────────────────────────────────────────────────────────

-- wallet_accounts (off-chain internal balances)
CREATE TABLE wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  locked_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SIDRA',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_accounts_non_negative_balance CHECK (balance >= 0),
  CONSTRAINT wallet_accounts_non_negative_locked_balance CHECK (locked_balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counterparty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type wallet_transaction_type NOT NULL,
  direction wallet_transaction_direction NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  fee NUMERIC(20, 8) NOT NULL DEFAULT 0,
  status wallet_transaction_status NOT NULL DEFAULT 'pending',
  network TEXT,
  tx_hash TEXT,
  to_address TEXT,
  from_address TEXT,
  deposit_address TEXT,
  reference_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_transactions_positive_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) NOT NULL,
  fee NUMERIC(20, 8) NOT NULL DEFAULT 0,
  to_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'sidra',
  status wallet_withdrawal_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_withdrawals_positive_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS wallet_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 1000,
  single_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_deposit_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL DEFAULT 'sidra',
  address TEXT UNIQUE NOT NULL,
  derivation_index INTEGER UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_block BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Drop memo column if it exists (we use unique address per user, no memo)
ALTER TABLE wallet_deposit_addresses DROP COLUMN IF EXISTS memo;

CREATE TABLE IF NOT EXISTS wallet_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────
-- 5. Indexes
-- ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user_id ON wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id_created_at ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status_type ON wallet_transactions(status, type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash ON wallet_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_addresses_address ON wallet_deposit_addresses(address);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_addresses_network_active ON wallet_deposit_addresses(network, is_active);

-- ────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ────────────────────────────────────────────────────────
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_audit_logs ENABLE ROW LEVEL SECURITY;

-- wallet_accounts
DROP POLICY IF EXISTS "Users can read own wallet account" ON wallet_accounts;
DROP POLICY IF EXISTS "Service role can manage wallet accounts" ON wallet_accounts;
CREATE POLICY "Users can read own wallet account" ON wallet_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage wallet accounts" ON wallet_accounts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- wallet_transactions
DROP POLICY IF EXISTS "Users can read own transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON wallet_transactions;
CREATE POLICY "Users can read own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage transactions" ON wallet_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- wallet_withdrawals
DROP POLICY IF EXISTS "Users can read own withdrawals" ON wallet_withdrawals;
DROP POLICY IF EXISTS "Service role can manage withdrawals" ON wallet_withdrawals;
CREATE POLICY "Users can read own withdrawals" ON wallet_withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage withdrawals" ON wallet_withdrawals FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- wallet_limits
DROP POLICY IF EXISTS "Users can read own limits" ON wallet_limits;
DROP POLICY IF EXISTS "Service role can manage limits" ON wallet_limits;
CREATE POLICY "Users can read own limits" ON wallet_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage limits" ON wallet_limits FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- wallet_deposit_addresses
DROP POLICY IF EXISTS "Users can read own deposit addresses" ON wallet_deposit_addresses;
DROP POLICY IF EXISTS "Service role can manage deposit addresses" ON wallet_deposit_addresses;
CREATE POLICY "Users can read own deposit addresses" ON wallet_deposit_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage deposit addresses" ON wallet_deposit_addresses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- wallet_audit_logs (service-only)
DROP POLICY IF EXISTS "Service role can manage audit logs" ON wallet_audit_logs;
CREATE POLICY "Service role can manage audit logs" ON wallet_audit_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────
-- 7. Updated-at triggers
-- ────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS wallet_accounts_set_updated_at ON wallet_accounts;
CREATE TRIGGER wallet_accounts_set_updated_at BEFORE UPDATE ON wallet_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_transactions_set_updated_at ON wallet_transactions;
CREATE TRIGGER wallet_transactions_set_updated_at BEFORE UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_withdrawals_set_updated_at ON wallet_withdrawals;
CREATE TRIGGER wallet_withdrawals_set_updated_at BEFORE UPDATE ON wallet_withdrawals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_limits_set_updated_at ON wallet_limits;
CREATE TRIGGER wallet_limits_set_updated_at BEFORE UPDATE ON wallet_limits FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_deposit_addresses_set_updated_at ON wallet_deposit_addresses;
CREATE TRIGGER wallet_deposit_addresses_set_updated_at BEFORE UPDATE ON wallet_deposit_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────
-- 8. Auto-provision trigger (new user → wallet_accounts + wallet_limits)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_default_wallet_resources()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet_accounts (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO wallet_limits (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_create_default_wallet_resources ON users;
CREATE TRIGGER users_create_default_wallet_resources
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_wallet_resources();

-- ────────────────────────────────────────────────────────
-- 9. RPC: Atomic internal transfer
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wallet_internal_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sender_balance NUMERIC;
  transaction_ref UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_sender_id = p_recipient_id THEN RAISE EXCEPTION 'Sender and recipient must be different'; END IF;

  INSERT INTO wallet_accounts (user_id) VALUES (p_sender_id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO wallet_accounts (user_id) VALUES (p_recipient_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO sender_balance FROM wallet_accounts WHERE user_id = p_sender_id FOR UPDATE;
  IF sender_balance < (p_amount + COALESCE(p_fee, 0)) THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE wallet_accounts SET balance = balance - (p_amount + COALESCE(p_fee, 0)) WHERE user_id = p_sender_id;
  UPDATE wallet_accounts SET balance = balance + p_amount WHERE user_id = p_recipient_id;

  INSERT INTO wallet_transactions (user_id, counterparty_user_id, type, direction, amount, fee, status, network, reference_id, description, metadata)
  VALUES (p_sender_id, p_recipient_id, 'internal_transfer', 'debit', p_amount, COALESCE(p_fee, 0), 'success', 'internal', p_reference_id, p_description, '{"side":"sender"}'::jsonb)
  RETURNING id INTO transaction_ref;

  INSERT INTO wallet_transactions (user_id, counterparty_user_id, type, direction, amount, fee, status, network, reference_id, description, metadata)
  VALUES (p_recipient_id, p_sender_id, 'internal_transfer', 'credit', p_amount, 0, 'success', 'internal', p_reference_id, p_description, '{"side":"recipient"}'::jsonb);

  IF COALESCE(p_fee, 0) > 0 THEN
    INSERT INTO wallet_transactions (user_id, type, direction, amount, fee, status, network, reference_id, description, metadata)
    VALUES (p_sender_id, 'fee', 'debit', p_fee, 0, 'success', 'internal', p_reference_id, 'Internal transfer fee', '{"fee_for":"internal_transfer"}'::jsonb);
  END IF;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────
-- 10. RPC: Atomic deposit credit
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wallet_credit_deposit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_tx_hash TEXT,
  p_network TEXT,
  p_deposit_address TEXT,
  p_confirmations INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  transaction_ref UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE tx_hash = p_tx_hash AND user_id = p_user_id AND type = 'deposit' AND status = 'success'
  ) THEN
    RAISE EXCEPTION 'Deposit already credited';
  END IF;

  UPDATE wallet_accounts SET balance = balance + p_amount WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (user_id, type, direction, amount, fee, status, tx_hash, network, deposit_address, description, metadata)
  VALUES (p_user_id, 'deposit', 'credit', p_amount, 0, 'success', p_tx_hash, p_network, p_deposit_address,
         'On-chain deposit credited',
         jsonb_build_object('confirmations', p_confirmations) || COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO transaction_ref;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────
-- 11. RPC: Atomic withdrawal creation
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wallet_create_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_to_address TEXT,
  p_network TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  current_balance NUMERIC;
  withdrawal_ref UUID;
  transaction_ref UUID;
  total_debit NUMERIC;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  total_debit := p_amount + COALESCE(p_fee, 0);

  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO current_balance FROM wallet_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF current_balance < total_debit THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE wallet_accounts SET balance = balance - total_debit WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (user_id, type, direction, amount, fee, status, to_address, network, reference_id, description, metadata)
  VALUES (p_user_id, 'withdrawal', 'debit', p_amount, COALESCE(p_fee, 0), 'pending', p_to_address, p_network, p_reference_id, p_description, '{"phase":"queued"}'::jsonb)
  RETURNING id INTO transaction_ref;

  INSERT INTO wallet_withdrawals (user_id, amount, fee, to_address, network, status, wallet_transaction_id)
  VALUES (p_user_id, p_amount, COALESCE(p_fee, 0), p_to_address, p_network, 'pending', transaction_ref)
  RETURNING id INTO withdrawal_ref;

  RETURN jsonb_build_object('withdrawal_id', withdrawal_ref, 'transaction_id', transaction_ref);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
