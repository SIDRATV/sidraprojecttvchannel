-- Secure exchange-style wallet schema (Supabase/PostgreSQL)
-- Focused only on wallet backend logic

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_tx_type') THEN
    CREATE TYPE wallet_tx_type AS ENUM ('deposit', 'withdrawal', 'internal_transfer', 'adjustment', 'sweep');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_tx_status') THEN
    CREATE TYPE wallet_tx_status AS ENUM ('pending', 'processing', 'confirmed', 'failed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('sidra', 'bsc', 'bsk')),
  address TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, network)
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('sidra', 'bsc', 'bsk')),
  balance NUMERIC(30, 12) NOT NULL DEFAULT 0,
  locked_balance NUMERIC(30, 12) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, network),
  CONSTRAINT wallet_balances_non_negative CHECK (balance >= 0 AND locked_balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('sidra', 'bsc', 'bsk')),
  type wallet_tx_type NOT NULL,
  amount NUMERIC(30, 12) NOT NULL CHECK (amount > 0),
  fee NUMERIC(30, 12) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  status wallet_tx_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  network TEXT NOT NULL CHECK (network IN ('sidra', 'bsc', 'bsk')),
  from_address TEXT,
  to_address TEXT NOT NULL,
  amount NUMERIC(30, 12) NOT NULL CHECK (amount > 0),
  tx_hash TEXT NOT NULL,
  block_number BIGINT,
  confirmations INTEGER NOT NULL DEFAULT 0,
  status wallet_tx_status NOT NULL DEFAULT 'pending',
  sweep_tx_hash TEXT,
  sweep_status wallet_tx_status,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (network, tx_hash)
);

CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  network TEXT NOT NULL CHECK (network IN ('sidra', 'bsc', 'bsk')),
  to_address TEXT NOT NULL,
  amount NUMERIC(30, 12) NOT NULL CHECK (amount > 0),
  fee NUMERIC(30, 12) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  tx_hash TEXT,
  status wallet_tx_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  reference_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backward-compatible migration for existing installations where tables already exist
ALTER TABLE IF EXISTS wallet_accounts ADD COLUMN IF NOT EXISTS network TEXT;
UPDATE wallet_accounts SET network = 'sidra' WHERE network IS NULL;
ALTER TABLE wallet_accounts ALTER COLUMN network SET NOT NULL;

ALTER TABLE IF EXISTS wallet_balances ADD COLUMN IF NOT EXISTS network TEXT;
UPDATE wallet_balances SET network = 'sidra' WHERE network IS NULL;
ALTER TABLE wallet_balances ALTER COLUMN network SET NOT NULL;

ALTER TABLE IF EXISTS wallet_transactions ADD COLUMN IF NOT EXISTS network TEXT;
UPDATE wallet_transactions SET network = 'sidra' WHERE network IS NULL;
ALTER TABLE wallet_transactions ALTER COLUMN network SET NOT NULL;

ALTER TABLE IF EXISTS wallet_deposits ADD COLUMN IF NOT EXISTS network TEXT;
UPDATE wallet_deposits SET network = 'sidra' WHERE network IS NULL;
ALTER TABLE wallet_deposits ALTER COLUMN network SET NOT NULL;

ALTER TABLE IF EXISTS wallet_withdrawals ADD COLUMN IF NOT EXISTS network TEXT;
UPDATE wallet_withdrawals SET network = 'sidra' WHERE network IS NULL;
ALTER TABLE wallet_withdrawals ALTER COLUMN network SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_accounts_network_check'
  ) THEN
    ALTER TABLE wallet_accounts
      ADD CONSTRAINT wallet_accounts_network_check CHECK (network IN ('sidra', 'bsc', 'bsk'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_balances_network_check'
  ) THEN
    ALTER TABLE wallet_balances
      ADD CONSTRAINT wallet_balances_network_check CHECK (network IN ('sidra', 'bsc', 'bsk'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_network_check'
  ) THEN
    ALTER TABLE wallet_transactions
      ADD CONSTRAINT wallet_transactions_network_check CHECK (network IN ('sidra', 'bsc', 'bsk'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_deposits_network_check'
  ) THEN
    ALTER TABLE wallet_deposits
      ADD CONSTRAINT wallet_deposits_network_check CHECK (network IN ('sidra', 'bsc', 'bsk'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_withdrawals_network_check'
  ) THEN
    ALTER TABLE wallet_withdrawals
      ADD CONSTRAINT wallet_withdrawals_network_check CHECK (network IN ('sidra', 'bsc', 'bsk'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user_network ON wallet_accounts(user_id, network);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_network ON wallet_balances(user_id, network);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_network_status ON wallet_transactions(network, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_status_created ON wallet_deposits(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status_retry ON wallet_withdrawals(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_reference ON wallet_logs(reference_id, created_at DESC);

ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own wallet accounts" ON wallet_accounts;
DROP POLICY IF EXISTS "Users can read own wallet balances" ON wallet_balances;
DROP POLICY IF EXISTS "Users can read own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can read own wallet deposits" ON wallet_deposits;
DROP POLICY IF EXISTS "Users can read own wallet withdrawals" ON wallet_withdrawals;
DROP POLICY IF EXISTS "Users can read own wallet logs" ON wallet_logs;
DROP POLICY IF EXISTS "Service role manages wallet accounts" ON wallet_accounts;
DROP POLICY IF EXISTS "Service role manages wallet balances" ON wallet_balances;
DROP POLICY IF EXISTS "Service role manages wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Service role manages wallet deposits" ON wallet_deposits;
DROP POLICY IF EXISTS "Service role manages wallet withdrawals" ON wallet_withdrawals;
DROP POLICY IF EXISTS "Service role manages wallet logs" ON wallet_logs;

CREATE POLICY "Users can read own wallet accounts"
  ON wallet_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet balances"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet deposits"
  ON wallet_deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet withdrawals"
  ON wallet_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet logs"
  ON wallet_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages wallet accounts"
  ON wallet_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages wallet balances"
  ON wallet_balances FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages wallet transactions"
  ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages wallet deposits"
  ON wallet_deposits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages wallet withdrawals"
  ON wallet_withdrawals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages wallet logs"
  ON wallet_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');