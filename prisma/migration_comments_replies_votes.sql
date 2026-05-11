-- ==========================================================
-- COMMENTS REPLIES + VOTING
-- Run AFTER migration_comments_moderation.sql
-- ==========================================================

-- Add replies support and dislike counter to existing table
ALTER TABLE premium_video_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES premium_video_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Vote tracking (prevents double-voting per user per comment)
CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id UUID NOT NULL REFERENCES premium_video_comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON comment_votes (user_id);

ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own votes" ON comment_votes;
CREATE POLICY "Users manage own votes" ON comment_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
