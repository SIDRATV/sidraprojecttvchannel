-- Migration: Add premium_plan column to users table
-- Run this in the Supabase SQL editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS premium_plan TEXT CHECK (premium_plan IN ('pro', 'premium', 'vip')),
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for premium plan filtering
CREATE INDEX IF NOT EXISTS idx_users_premium_plan ON users (premium_plan)
  WHERE premium_plan IS NOT NULL;
