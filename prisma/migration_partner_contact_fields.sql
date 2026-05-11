-- Migration: Add sda_amount, show_contact_email, contact_email to partners table
-- Run in Supabase SQL Editor

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS sda_amount NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_contact_email BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '';
