-- ============================================================
-- Add notifications table to Supabase Realtime publication
-- Required for instant push notifications via Supabase Realtime.
-- Run once in Supabase SQL Editor.
-- ============================================================

-- Add notifications table to the realtime publication so the
-- AppHeader Realtime subscription receives INSERT events instantly.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify
SELECT pubname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';
