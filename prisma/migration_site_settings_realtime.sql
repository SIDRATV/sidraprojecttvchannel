-- ============================================================
-- Add site_settings to Supabase Realtime publication
-- Required for AppLayout to receive instant maintenance mode updates
-- Run once in Supabase SQL Editor
-- ============================================================

-- Add site_settings to realtime publication (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
  END IF;
END $$;
