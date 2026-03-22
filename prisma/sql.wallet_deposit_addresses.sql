-- Wallet Deposit Addresses table (unique address strategy) with RLS policies
CREATE TABLE IF NOT EXISTS wallet_deposit_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL DEFAULT 'sidra',
  address TEXT UNIQUE NOT NULL,
  memo TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_block BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE wallet_deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Wallet Deposit Addresses RLS Policies
DROP POLICY IF EXISTS "Users can read own deposit address" ON wallet_deposit_addresses;
DROP POLICY IF EXISTS "Service role can manage deposit addresses" ON wallet_deposit_addresses;

CREATE POLICY "Users can read own deposit address"
  ON wallet_deposit_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage deposit addresses"
  ON wallet_deposit_addresses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
