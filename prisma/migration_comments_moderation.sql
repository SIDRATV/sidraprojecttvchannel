-- ==========================================================
-- COMMENTS MODERATION SYSTEM
-- Run in Supabase SQL Editor
-- ==========================================================

-- 1. Premium video comments
CREATE TABLE IF NOT EXISTS premium_video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  premium_video_id UUID NOT NULL REFERENCES premium_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  likes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_video_comments_video ON premium_video_comments (premium_video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_video_comments_user ON premium_video_comments (user_id);

-- 2. Banned words table
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT banned_words_word_unique UNIQUE (word)
);

-- 3. RLS
ALTER TABLE premium_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Premium comments visible" ON premium_video_comments;
DROP POLICY IF EXISTS "Authenticated insert comment" ON premium_video_comments;
DROP POLICY IF EXISTS "Users delete own comment" ON premium_video_comments;
DROP POLICY IF EXISTS "Admin delete any comment" ON premium_video_comments;
DROP POLICY IF EXISTS "Banned words readable" ON banned_words;

CREATE POLICY "Premium comments visible"
  ON premium_video_comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated insert comment"
  ON premium_video_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comment"
  ON premium_video_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can UPDATE (soft-delete) via service role key — no extra policy needed
-- banned_words: readable by all, writable only via service role
CREATE POLICY "Banned words readable"
  ON banned_words FOR SELECT
  USING (true);
