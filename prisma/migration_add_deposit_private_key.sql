-- Migration: Add encrypted_private_key to wallet_deposit_addresses
-- This allows sweep functionality: moving deposited funds from user addresses to hot wallet
-- The private key is stored encrypted with AES-256-GCM using ENCRYPTION_KEY

ALTER TABLE wallet_deposit_addresses
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT;

-- Add swept_at column to track when funds were swept to hot wallet
ALTER TABLE wallet_deposit_addresses
ADD COLUMN IF NOT EXISTS swept_at TIMESTAMP WITH TIME ZONE;

-- Add sweep_tx_hash to track the sweep transaction
ALTER TABLE wallet_deposit_addresses
ADD COLUMN IF NOT EXISTS sweep_tx_hash TEXT;
