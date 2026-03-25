-- CREATE TYPE for wallet withdrawals
-- 'refunded' = terminal state after max retries exhausted (balance credited back to user)
CREATE TYPE IF NOT EXISTS wallet_withdrawal_status AS ENUM ('pending', 'processing', 'success', 'failed', 'refunded');

-- Wallet Withdrawals table (on-chain payouts queue) with RLS policies
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
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_withdrawals_positive_amount CHECK (amount > 0)
);

-- Enable Row Level Security
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;

-- Wallet Withdrawals RLS Policies
DROP POLICY IF EXISTS "Users can read own withdrawals" ON wallet_withdrawals;
DROP POLICY IF EXISTS "Service role can manage withdrawals" ON wallet_withdrawals;

CREATE POLICY "Users can read own withdrawals"
  ON wallet_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage withdrawals"
  ON wallet_withdrawals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
