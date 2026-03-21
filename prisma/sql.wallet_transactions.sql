-- CREATE TYPES for wallet transactions
CREATE TYPE IF NOT EXISTS wallet_transaction_type AS ENUM (
  'internal_transfer',
  'withdrawal',
  'deposit',
  'fee',
  'adjustment'
);

CREATE TYPE IF NOT EXISTS wallet_transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE IF NOT EXISTS wallet_transaction_status AS ENUM ('pending', 'success', 'failed');

-- Wallet Transactions table (ledger) with RLS policies
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_transactions_positive_amount CHECK (amount > 0)
);

-- Enable Row Level Security
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet Transactions RLS Policies
DROP POLICY IF EXISTS "Users can read own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Service role can manage wallet transactions" ON wallet_transactions;

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet transactions"
  ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
