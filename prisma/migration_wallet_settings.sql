-- Migration: Create wallet_settings table for admin-configurable settings
-- Run this in your Supabase SQL editor or via your migration tool

CREATE TABLE IF NOT EXISTS wallet_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default gas fee (100 BPS = 1%)
INSERT INTO wallet_settings (key, value, updated_at)
VALUES ('withdrawal_gas_fee_bps', '100', NOW())
ON CONFLICT (key) DO NOTHING;

-- Enable RLS — only service role can read/write (admin APIs use service role)
ALTER TABLE wallet_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically
-- No additional policies needed for server-side-only access
