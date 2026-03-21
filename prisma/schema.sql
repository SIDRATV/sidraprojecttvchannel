-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet accounts (off-chain internal balances)
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  locked_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SIDRA',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_accounts_non_negative_balance CHECK (balance >= 0),
  CONSTRAINT wallet_accounts_non_negative_locked_balance CHECK (locked_balance >= 0)
);

CREATE TYPE wallet_transaction_type AS ENUM (
  'internal_transfer',
  'withdrawal',
  'deposit',
  'fee',
  'adjustment'
);

CREATE TYPE wallet_transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE wallet_transaction_status AS ENUM ('pending', 'success', 'failed');

-- Ledger table (single source of truth for wallet movement history)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counterparty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type wallet_transaction_type NOT NULL,
  direction wallet_transaction_direction NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  fee NUMERIC(20, 8) NOT NULL DEFAULT 0,
  status wallet_transaction_status NOT NULL DEFAULT 'pending',
  network TEXT,
  tx_hash TEXT,
  to_address TEXT,
  from_address TEXT,
  deposit_address TEXT,
  reference_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_transactions_positive_amount CHECK (amount > 0)
);

CREATE TYPE wallet_withdrawal_status AS ENUM ('pending', 'processing', 'success', 'failed');

-- Withdrawal queue for on-chain payouts
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) NOT NULL,
  fee NUMERIC(20, 8) NOT NULL DEFAULT 0,
  to_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'sidra',
  status wallet_withdrawal_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_withdrawals_positive_amount CHECK (amount > 0)
);

-- Per-user withdrawal limits (daily)
CREATE TABLE IF NOT EXISTS wallet_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 1000,
  single_withdrawal_limit NUMERIC(20, 8) NOT NULL DEFAULT 500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deposit addressing (unique address strategy)
CREATE TABLE IF NOT EXISTS wallet_deposit_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL DEFAULT 'sidra',
  address TEXT UNIQUE NOT NULL,
  derivation_index INTEGER UNIQUE,
  memo TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_block BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional wallet audit table for sensitive actions (retry, approval, sync)
CREATE TABLE IF NOT EXISTS wallet_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE,
  video_type TEXT CHECK (video_type IN ('documentary', 'tutorial', 'news', 'interview')) DEFAULT 'documentary'
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id)
);

-- Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  avg_watch_time INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_by ON videos(created_by);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_video_id ON analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user_id ON wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id_created_at ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status_type ON wallet_transactions(status, type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash ON wallet_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status_next_retry ON wallet_withdrawals(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_id ON wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_addresses_network_address ON wallet_deposit_addresses(network, address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS policies (all public read, authenticated can read own)
DROP POLICY IF EXISTS "Users are publicly readable" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;

CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Videos RLS policies - ONLY ADMINS can INSERT, author/admin can UPDATE
DROP POLICY IF EXISTS "Videos are publicly readable" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON videos;

CREATE POLICY "Videos are publicly readable" ON videos FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos"
  ON videos FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Author or admin can update videos"
  ON videos FOR UPDATE 
  USING (auth.uid() = created_by OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true)
  WITH CHECK (auth.uid() = created_by OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Only admins can delete videos"
  ON videos FOR DELETE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

-- Comments RLS policies
DROP POLICY IF EXISTS "Comments are publicly readable" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Likes RLS policies
DROP POLICY IF EXISTS "Likes are publicly readable" ON likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

CREATE POLICY "Likes are publicly readable" ON likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE 
  USING (auth.uid() = user_id);

-- Categories RLS policies
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

-- Newsletter RLS policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter;

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter FOR INSERT WITH CHECK (true);

-- Wallet RLS policies
DROP POLICY IF EXISTS "Users can read own wallet account" ON wallet_accounts;
DROP POLICY IF EXISTS "Service role can manage wallet accounts" ON wallet_accounts;

CREATE POLICY "Users can read own wallet account"
  ON wallet_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet accounts"
  ON wallet_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Service role can manage wallet transactions" ON wallet_transactions;

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet transactions"
  ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own withdrawals" ON wallet_withdrawals;
DROP POLICY IF EXISTS "Service role can manage withdrawals" ON wallet_withdrawals;

CREATE POLICY "Users can read own withdrawals"
  ON wallet_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage withdrawals"
  ON wallet_withdrawals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own wallet limits" ON wallet_limits;
DROP POLICY IF EXISTS "Service role can manage wallet limits" ON wallet_limits;

CREATE POLICY "Users can read own wallet limits"
  ON wallet_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet limits"
  ON wallet_limits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own deposit address" ON wallet_deposit_addresses;
DROP POLICY IF EXISTS "Service role can manage deposit addresses" ON wallet_deposit_addresses;

CREATE POLICY "Users can read own deposit address"
  ON wallet_deposit_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage deposit addresses"
  ON wallet_deposit_addresses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage wallet audit logs" ON wallet_audit_logs;

CREATE POLICY "Service role can manage wallet audit logs"
  ON wallet_audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger helper for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
      p_reference_id,
      'Internal transfer fee',
      jsonb_build_object('fee_for', 'internal_transfer')
    );
  END IF;

  RETURN transaction_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic deposit credit RPC
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
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  INSERT INTO wallet_accounts (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE tx_hash = p_tx_hash
      AND user_id = p_user_id
      AND type = 'deposit'
      AND status = 'success'
  ) THEN
    RAISE EXCEPTION 'Deposit already credited';
  END IF;

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

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Documentaries', 'In-depth Islamic documentaries and educational content', 'Film', '#5b63f5'),
  ('Tutorials', 'Technology and Sidra ecosystem tutorials', 'Lightbulb', '#f59e0b'),
  ('News', 'Latest updates and news from the Sidra ecosystem', 'AlertCircle', '#16a34a'),
  ('Interviews', 'In-depth interviews with industry leaders', 'Mic2', '#14b8a6'),
  ('Inspirational', 'Islamic inspirational and motivational content', 'Heart', '#ec4899'),
  ('Technology', 'Technology innovation within Islam', 'Zap', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
