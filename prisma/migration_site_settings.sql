-- ============================================================
-- SITE SETTINGS TABLE (maintenance mode, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

-- Insert default maintenance mode settings
INSERT INTO site_settings (key, value)
VALUES (
  'maintenance_mode',
  '{"enabled": false, "message": "Nous sommes en maintenance, nous reviendrons bientôt. Merci pour votre patience.", "exempt_user_ids": []}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for maintenance status check (needed by middleware/client)
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Only service_role can modify (admin API uses service role)
CREATE POLICY "Service role can manage site settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
