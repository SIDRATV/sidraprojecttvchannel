-- ============================================================
-- FIX DEPOSIT SYSTEM — Run in Supabase SQL Editor
-- Fixes wallet_credit_deposit + wallet_accounts network column
-- ============================================================

-- 1. Fix wallet_accounts.network: add DEFAULT 'sidra' if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_accounts' AND column_name = 'network'
  ) THEN
    -- Add default so INSERT without network won't fail
    ALTER TABLE wallet_accounts ALTER COLUMN network SET DEFAULT 'sidra';
    -- Fill any NULLs
    UPDATE wallet_accounts SET network = 'sidra' WHERE network IS NULL;
  END IF;
END $$;

-- 2. Ensure enum values exist (safe IF NOT EXISTS)
DO $$
BEGIN
  -- These may already exist from migration_notifications_and_enum_fix.sql
  BEGIN ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'subscription'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE wallet_transaction_direction ADD VALUE IF NOT EXISTS 'out'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE wallet_transaction_direction ADD VALUE IF NOT EXISTS 'in'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE wallet_transaction_status ADD VALUE IF NOT EXISTS 'completed'; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Ensure wallet_transactions_network_check allows 'internal'
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_network_check;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_transactions_network_check
  CHECK (network IN ('sidra', 'bsc', 'bsk', 'internal'));

-- 4. Recreate wallet_credit_deposit() — ROBUST version
--    Handles: network column on wallet_accounts, pending→confirmed, new deposit, duplicate detection
CREATE OR REPLACE FUNCTION wallet_credit_deposit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_tx_hash TEXT,
  p_network TEXT,
  p_deposit_address TEXT,
  p_confirmations INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  transaction_ref UUID;
  existing_status wallet_transaction_status;
  existing_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Ensure wallet_accounts row exists (includes network with default)
  INSERT INTO wallet_accounts (user_id, balance, locked_balance, currency)
  VALUES (p_user_id, 0, 0, 'SIDRA')
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if this tx already exists
  SELECT id, status INTO existing_id, existing_status
  FROM wallet_transactions
  WHERE tx_hash = p_tx_hash
    AND user_id = p_user_id
    AND type = 'deposit'
  LIMIT 1;

  -- Already credited
  IF existing_status = 'success' THEN
    RAISE EXCEPTION 'Deposit already credited';
  END IF;

  -- Pending → Confirmed: update status and credit balance
  IF existing_status = 'pending' THEN
    UPDATE wallet_transactions
    SET status = 'success',
        description = 'On-chain deposit credited',
        metadata = jsonb_build_object('confirmations', p_confirmations, 'confirmed_at', NOW()::text) || COALESCE(p_metadata, '{}'::jsonb)
    WHERE id = existing_id;

    UPDATE wallet_accounts
    SET balance = balance + p_amount
    WHERE user_id = p_user_id;

    RETURN existing_id;
  END IF;

  -- New deposit: insert as success + credit balance
  UPDATE wallet_accounts
  SET balance = balance + p_amount
  WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (
    user_id,
    type,
    direction,
    amount,
    fee,
    status,
    tx_hash,
    network,
    deposit_address,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'deposit',
    'credit',
    p_amount,
    0,
    'success',
    p_tx_hash,
    p_network,
    p_deposit_address,
    'On-chain deposit credited',
    jsonb_build_object('confirmations', p_confirmations) || COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING id INTO transaction_ref;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Reset last_checked_block to rescan recent blocks (catch missed deposits)
--    This forces the scanner to re-check the last ~500 blocks on next run
UPDATE wallet_deposit_addresses
SET last_checked_block = GREATEST(0, last_checked_block - 500)
WHERE is_active = true;
