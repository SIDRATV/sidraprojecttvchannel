-- Test: Verify all components are working
-- Run in Supabase SQL Editor

-- 1. Test functions exist
SELECT proname FROM pg_proc WHERE proname IN ('create_notification', 'broadcast_notification');

-- 2. Test notification table exists
SELECT * FROM information_schema.tables WHERE table_name = 'notifications';

-- 3. Test notifications_enabled column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name='users' AND column_name='notifications_enabled';

-- 4. Manually create a test notification for current user
-- Replace with real user UUID
SELECT create_notification(
  'YOUR_USER_UUID_HERE'::UUID,
  'transaction',
  'Test Transaction',
  'This is a test notification for transaction',
  'wallet',
  '/wallet'
);

-- 5. Check if notification was created
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
