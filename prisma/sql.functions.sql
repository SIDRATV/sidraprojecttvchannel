-- Trigger helper for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS wallet_accounts_set_updated_at ON wallet_accounts;
CREATE TRIGGER wallet_accounts_set_updated_at
  BEFORE UPDATE ON wallet_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_transactions_set_updated_at ON wallet_transactions;
CREATE TRIGGER wallet_transactions_set_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_withdrawals_set_updated_at ON wallet_withdrawals;
CREATE TRIGGER wallet_withdrawals_set_updated_at
  BEFORE UPDATE ON wallet_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_limits_set_updated_at ON wallet_limits;
CREATE TRIGGER wallet_limits_set_updated_at
  BEFORE UPDATE ON wallet_limits
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS wallet_deposit_addresses_set_updated_at ON wallet_deposit_addresses;
CREATE TRIGGER wallet_deposit_addresses_set_updated_at
  BEFORE UPDATE ON wallet_deposit_addresses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Ensure each user has an internal wallet and default limits
CREATE OR REPLACE FUNCTION create_default_wallet_resources()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet_accounts (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO wallet_limits (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_create_default_wallet_resources ON users;
CREATE TRIGGER users_create_default_wallet_resources
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_wallet_resources();

-- Atomic internal transfer RPC
CREATE OR REPLACE FUNCTION wallet_internal_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sender_balance NUMERIC;
  transaction_ref UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Sender and recipient must be different';
  END IF;

  INSERT INTO wallet_accounts (user_id) VALUES (p_sender_id)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO wallet_accounts (user_id) VALUES (p_recipient_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO sender_balance
  FROM wallet_accounts
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF sender_balance < (p_amount + COALESCE(p_fee, 0)) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE wallet_accounts
  SET balance = balance - (p_amount + COALESCE(p_fee, 0))
  WHERE user_id = p_sender_id;

  UPDATE wallet_accounts
  SET balance = balance + p_amount
  WHERE user_id = p_recipient_id;

  INSERT INTO wallet_transactions (
    user_id,
    counterparty_user_id,
    type,
    direction,
    amount,
    fee,
    status,
    network,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_sender_id,
    p_recipient_id,
    'internal_transfer',
    'debit',
    p_amount,
    COALESCE(p_fee, 0),
    'success',
    'internal',
    p_reference_id,
    p_description,
    jsonb_build_object('side', 'sender')
  ) RETURNING id INTO transaction_ref;

  INSERT INTO wallet_transactions (
    user_id,
    counterparty_user_id,
    type,
    direction,
    amount,
    fee,
    status,
    network,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    'internal_transfer',
    'credit',
    p_amount,
    0,
    'success',
    'internal',
    p_reference_id,
    p_description,
    jsonb_build_object('side', 'recipient')
  );

  IF COALESCE(p_fee, 0) > 0 THEN
    INSERT INTO wallet_transactions (
      user_id,
      type,
      direction,
      amount,
      fee,
      status,
      network,
      reference_id,
      description,
      metadata
    ) VALUES (
      p_sender_id,
      'fee',
      'debit',
      p_fee,
      0,
      'success',
      'internal',
      p_reference_id,
      'Internal transfer fee',
      jsonb_build_object('fee_for', 'internal_transfer')
    );
  END IF;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic deposit credit RPC (handles both new deposits and pending→confirmed)
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

  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id)
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

-- Atomic withdrawal creation RPC (reserve/debit balance + queue payout)
CREATE OR REPLACE FUNCTION wallet_create_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_to_address TEXT,
  p_network TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  current_balance NUMERIC;
  withdrawal_ref UUID;
  transaction_ref UUID;
  total_debit NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  total_debit := p_amount + COALESCE(p_fee, 0);

  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO current_balance
  FROM wallet_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance < total_debit THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE wallet_accounts
  SET balance = balance - total_debit
  WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (
    user_id,
    type,
    direction,
    amount,
    fee,
    status,
    to_address,
    network,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'withdrawal',
    'debit',
    p_amount,
    COALESCE(p_fee, 0),
    'pending',
    p_to_address,
    p_network,
    p_reference_id,
    p_description,
    jsonb_build_object('phase', 'queued')
  ) RETURNING id INTO transaction_ref;

  INSERT INTO wallet_withdrawals (
    user_id,
    amount,
    fee,
    to_address,
    network,
    status,
    wallet_transaction_id
  ) VALUES (
    p_user_id,
    p_amount,
    COALESCE(p_fee, 0),
    p_to_address,
    p_network,
    'pending',
    transaction_ref
  ) RETURNING id INTO withdrawal_ref;

  RETURN jsonb_build_object(
    'withdrawal_id', withdrawal_ref,
    'transaction_id', transaction_ref
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment views (safe public function)
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos SET views = views + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic withdrawal refund RPC (called after MAX_RETRIES exhausted)
-- Guards against double-refund: raises exception if already in terminal state
CREATE OR REPLACE FUNCTION wallet_refund_withdrawal(
  p_withdrawal_id UUID,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  w RECORD;
  refund_amount NUMERIC;
BEGIN
  -- Lock the withdrawal row to prevent race conditions
  SELECT * INTO w
  FROM wallet_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found: %', p_withdrawal_id;
  END IF;

  -- Guard: already in a terminal state — do nothing (prevents double-refund)
  IF w.status IN ('refunded', 'success') THEN
    RAISE EXCEPTION 'Withdrawal % already in terminal state: %', p_withdrawal_id, w.status;
  END IF;

  refund_amount := COALESCE(w.amount, 0) + COALESCE(w.fee, 0);

  -- Mark withdrawal as refunded
  UPDATE wallet_withdrawals
  SET status = 'refunded',
      updated_at = NOW(),
      next_retry_at = NULL,
      last_error = p_error_message
  WHERE id = p_withdrawal_id;

  -- Update linked wallet transaction to refunded
  IF w.wallet_transaction_id IS NOT NULL THEN
    UPDATE wallet_transactions
    SET status = 'refunded',
        error_message = p_error_message,
        metadata = jsonb_build_object(
          'phase', 'refunded',
          'refunded_at', NOW()::text,
          'reason', p_error_message
        )
    WHERE id = w.wallet_transaction_id;
  END IF;

  -- Atomically credit balance back (no race condition — single UPDATE)
  INSERT INTO wallet_accounts (user_id, balance)
  VALUES (w.user_id, refund_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = wallet_accounts.balance + refund_amount;

  -- Insert refund credit transaction record
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
    w.user_id,
    'adjustment',
    'credit',
    refund_amount,
    0,
    'success',
    'internal',
    'Automatic refund for failed withdrawal',
    jsonb_build_object(
      'source_withdrawal_id', p_withdrawal_id,
      'reason', p_error_message,
      'refunded_at', NOW()::text
    )
  );

  -- Audit log
  INSERT INTO wallet_audit_logs (
    actor_user_id,
    action,
    target_id,
    details
  ) VALUES (
    w.user_id,
    'wallet.withdrawal.refunded',
    p_withdrawal_id,
    jsonb_build_object(
      'refund_amount', refund_amount,
      'reason', p_error_message,
      'network', w.network
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
