-- Wallet Audit Logs table with RLS policies
CREATE TABLE IF NOT EXISTS wallet_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE wallet_audit_logs ENABLE ROW LEVEL SECURITY;

-- Wallet Audit Logs RLS Policies
DROP POLICY IF EXISTS "Service role can manage wallet audit logs" ON wallet_audit_logs;

CREATE POLICY "Service role can manage wallet audit logs"
  ON wallet_audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
