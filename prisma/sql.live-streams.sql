-- Live Streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  viewers INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  streamer TEXT NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Live Streams RLS Policies
DROP POLICY IF EXISTS "Live streams are publicly readable" ON live_streams;
DROP POLICY IF EXISTS "Only admins can manage live streams" ON live_streams;

CREATE POLICY "Live streams are publicly readable" ON live_streams FOR SELECT USING (true);

CREATE POLICY "Admins can insert live streams"
  ON live_streams FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can update live streams"
  ON live_streams FOR UPDATE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can delete live streams"
  ON live_streams FOR DELETE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);
