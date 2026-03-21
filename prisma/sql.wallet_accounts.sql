-- Wallet Accounts table (off-chain internal balances) with RLS policies
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  locked_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SIDRA',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_accounts_non_negative_balance CHECK (balance >= 0),
  CONSTRAINT wallet_accounts_non_negative_locked_balance CHECK (locked_balance >= 0)
);

-- Enable Row Level Security
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Wallet Accounts RLS Policies
DROP POLICY IF EXISTS "Users can read own wallet account" ON wallet_accounts;
DROP POLICY IF EXISTS "Service role can manage wallet accounts" ON wallet_accounts;

CREATE POLICY "Users can read own wallet account"
  ON wallet_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet accounts"
  ON wallet_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
