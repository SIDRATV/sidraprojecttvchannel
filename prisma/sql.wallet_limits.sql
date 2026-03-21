-- Wallet Limits table (per-user daily withdrawal limits) with RLS policies
CREATE TABLE IF NOT EXISTS wallet_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 1000,
  single_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE wallet_limits ENABLE ROW LEVEL SECURITY;

-- Wallet Limits RLS Policies
DROP POLICY IF EXISTS "Users can read own wallet limits" ON wallet_limits;
DROP POLICY IF EXISTS "Service role can manage wallet limits" ON wallet_limits;

CREATE POLICY "Users can read own wallet limits"
  ON wallet_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet limits"
  ON wallet_limits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
