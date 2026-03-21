-- Analytics table with RLS policies
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  avg_watch_time INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Note: Analytics table does NOT have policies - only service_role can insert via triggers
-- Apply a default deny policy
DROP POLICY IF EXISTS "Default deny all on analytics" ON analytics;

CREATE POLICY "Default deny all on analytics"
  ON analytics FOR ALL
  USING (false)
  WITH CHECK (false);
