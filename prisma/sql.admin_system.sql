-- ============================================================
-- ADMIN ROLES SYSTEM - Run in Supabase SQL Editor
-- ============================================================

-- 1. Add status/block columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS premium_plan TEXT CHECK (premium_plan IN ('pro', 'premium', 'vip')),
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS block_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_warning_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Admin roles enum
DO $$ BEGIN
  CREATE TYPE admin_role_type AS ENUM ('super_admin', 'full_access', 'partial_access', 'read_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Admin roles definition table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type admin_role_type NOT NULL DEFAULT 'partial_access',
  permissions JSONB NOT NULL DEFAULT '{}',
  -- permissions example:
  -- {"users": true, "videos": true, "categories": true, "finances": false, "security": false, "admins": false}
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Admin assignments (link user <-> role)
CREATE TABLE IF NOT EXISTS admin_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- 5. Security events log
DO $$ BEGIN
  CREATE TYPE security_event_type AS ENUM (
    'login_suspicious',
    'brute_force',
    'admin_access_unauthorized',
    'multiple_failed_logins',
    'unusual_transaction',
    'account_takeover_attempt',
    'api_abuse',
    'intrusion_attempt',
    'cheating_detected',
    'server_attack',
    'manual_alert'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type security_event_type NOT NULL,
  severity security_event_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User action log (admin actions against users)
CREATE TABLE IF NOT EXISTS admin_user_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'block', 'unblock', 'warn', 'delete', 'assign_role', 'remove_role'
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Platform subscriptions revenue log
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'premium', 'vip')),
  amount_usd NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card', -- 'card', 'sptc', 'crypto'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'refunded')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users (is_blocked) WHERE is_blocked = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_premium_plan ON users (premium_plan) WHERE premium_plan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events (severity, is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_assignments_user ON admin_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_status ON platform_subscriptions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions (created_at DESC);

-- 9. RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only service_role can access admin tables
CREATE POLICY "Service role manages admin_roles" ON admin_roles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role manages admin_assignments" ON admin_assignments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role manages security_events" ON security_events FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role manages admin_user_actions" ON admin_user_actions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role manages platform_subscriptions" ON platform_subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 10. Default admin roles
INSERT INTO admin_roles (name, type, permissions, description) VALUES
  ('Super Admin', 'super_admin', '{"users":true,"videos":true,"categories":true,"finances":true,"security":true,"admins":true}', 'Accès complet à toute la plateforme'),
  ('Modérateur Contenu', 'partial_access', '{"users":true,"videos":true,"categories":true,"finances":false,"security":false,"admins":false}', 'Peut gérer les vidéos, utilisateurs et catégories'),
  ('Analyste Finances', 'partial_access', '{"users":false,"videos":false,"categories":false,"finances":true,"security":false,"admins":false}', 'Accès aux finances uniquement'),
  ('Observateur', 'read_only', '{"users":false,"videos":false,"categories":false,"finances":false,"security":false,"admins":false}', 'Lecture seule des statistiques')
ON CONFLICT (name) DO NOTHING;
