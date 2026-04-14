-- ============================================================
-- TEST NOTIFICATIONS SETUP
-- Copy and paste this entire script in Supabase SQL Editor
-- ============================================================

-- 1. Check if notifications_enabled column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='users' AND column_name='notifications_enabled';

-- 2. Check if create_notification function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'create_notification';

-- 3. Check if broadcast_notification function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'broadcast_notification';

-- 4. Check if notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'notifications';

-- 5. Check if triggers exist
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_new_video',
  'trigger_transaction_notification',
  'trigger_subscription_notification',
  'trigger_subscription_expiring'
);

-- 6. Check current user's notification settings
SELECT id, email, notifications_enabled 
FROM users 
WHERE id = auth.uid()
LIMIT 1;

-- 7. Manual test - Create a test notification
-- Replace YOUR_USER_ID with an actual user UUID
-- SELECT create_notification(
--   'YOUR_USER_ID'::UUID,
--   'test',
--   'Test Notification',
--   'This is a test notification',
--   'bell',
--   '/dashboard'
-- );

-- 8. Verify notifications were created
SELECT id, user_id, type, title, message, created_at, read
FROM notifications
ORDER BY created_at DESC
LIMIT 5;
