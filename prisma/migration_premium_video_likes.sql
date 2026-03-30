-- ============================================================
-- Premium Video Likes table
-- Tracks which users liked which premium videos
-- ============================================================

CREATE TABLE IF NOT EXISTS premium_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES premium_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_premium_video_likes_video ON premium_video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_premium_video_likes_user ON premium_video_likes(user_id);

-- RLS
ALTER TABLE premium_video_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium_likes_read" ON premium_video_likes;
CREATE POLICY "premium_likes_read" ON premium_video_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "premium_likes_insert" ON premium_video_likes;
CREATE POLICY "premium_likes_insert" ON premium_video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "premium_likes_delete" ON premium_video_likes;
CREATE POLICY "premium_likes_delete" ON premium_video_likes FOR DELETE USING (auth.uid() = user_id);

-- Function to toggle like and update the likes count on premium_videos
CREATE OR REPLACE FUNCTION toggle_premium_video_like(p_user_id UUID, p_video_id UUID)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INT;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM premium_video_likes WHERE user_id = p_user_id AND video_id = p_video_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM premium_video_likes WHERE user_id = p_user_id AND video_id = p_video_id;
    UPDATE premium_videos SET likes = GREATEST(likes - 1, 0) WHERE id = p_video_id;
  ELSE
    INSERT INTO premium_video_likes (user_id, video_id) VALUES (p_user_id, p_video_id);
    UPDATE premium_videos SET likes = likes + 1 WHERE id = p_video_id;
  END IF;

  SELECT likes INTO v_new_count FROM premium_videos WHERE id = p_video_id;

  RETURN json_build_object('liked', NOT v_exists, 'likes', v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
