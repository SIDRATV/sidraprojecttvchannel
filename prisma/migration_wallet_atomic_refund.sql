-- Atomic balance credit + adjustment transaction record.
-- Used by the withdrawal refund path to avoid the SELECT-then-UPDATE race condition.
-- Replaces: SELECT balance → UPDATE balance = old + amount → INSERT adjustment transaction
-- With:     Single PL/pgSQL call that does balance + amount atomically via FOR UPDATE lock.

CREATE OR REPLACE FUNCTION wallet_credit_adjustment(
  p_user_id     UUID,
  p_amount      NUMERIC,
  p_description TEXT    DEFAULT NULL,
  p_metadata    JSONB   DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  transaction_ref UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Adjustment amount must be greater than zero';
  END IF;

  -- Ensure wallet row exists (idempotent)
  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Atomic credit — no separate SELECT needed, avoids read-then-write race
  UPDATE wallet_accounts
  SET balance = balance + p_amount
  WHERE user_id = p_user_id;

  -- Record the adjustment transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    direction,
    amount,
    fee,
    status,
    network,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'adjustment',
    'credit',
    p_amount,
    0,
    'success',
    'internal',
    COALESCE(p_description, 'Balance adjustment'),
    COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING id INTO transaction_ref;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
