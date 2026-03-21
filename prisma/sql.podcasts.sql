-- Podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  duration TEXT NOT NULL,
  category TEXT NOT NULL,
  creator TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Podcasts RLS Policies
DROP POLICY IF EXISTS "Podcasts are publicly readable" ON podcasts;
DROP POLICY IF EXISTS "Only admins can manage podcasts" ON podcasts;

CREATE POLICY "Podcasts are publicly readable" ON podcasts FOR SELECT USING (true);

CREATE POLICY "Admins can insert podcasts"
  ON podcasts FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can update podcasts"
  ON podcasts FOR UPDATE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can delete podcasts"
  ON podcasts FOR DELETE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);
