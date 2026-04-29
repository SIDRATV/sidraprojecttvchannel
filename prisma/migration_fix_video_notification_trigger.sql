-- ============================================================
-- FIX: Video notification trigger was on wrong table
-- The admin uploads to 'premium_videos', not 'videos'
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop old incorrect trigger on 'videos' table (wasn't firing)
DROP TRIGGER IF EXISTS trigger_new_video ON videos;

-- Create trigger on the correct table: 'premium_videos'
CREATE OR REPLACE FUNCTION trigger_new_premium_video_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to all users with notifications enabled
  PERFORM broadcast_notification(
    'new_video',
    '🎬 Nouvelle vidéo disponible',
    'Découvrez: ' || NEW.title,
    'video',
    '/premium-videos/' || NEW.id::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_premium_video ON premium_videos;
CREATE TRIGGER trigger_new_premium_video
  AFTER INSERT ON premium_videos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_premium_video_notification();

-- Verify both triggers are active
SELECT 
  trigger_name,
  event_object_table AS "table",
  event_manipulation AS "event",
  action_timing AS "timing"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_new_video', 'trigger_new_premium_video', 'trigger_transaction_notification', 'trigger_subscription_notification')
ORDER BY event_object_table;
