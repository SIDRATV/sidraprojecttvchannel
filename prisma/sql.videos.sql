-- Videos table with RLS policies
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_featured BOOLEAN DEFAULT FALSE,
  video_type TEXT CHECK (video_type IN ('documentary', 'tutorial', 'news', 'interview')) DEFAULT 'documentary'
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Videos RLS Policies
DROP POLICY IF EXISTS "Videos are publicly readable" ON videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON videos;
DROP POLICY IF EXISTS "Author or admin can update videos" ON videos;
DROP POLICY IF EXISTS "Only admins can delete videos" ON videos;

CREATE POLICY "Videos are publicly readable" ON videos FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos"
  ON videos FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Only admins can update videos"
  ON videos FOR UPDATE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Only admins can delete videos"
  ON videos FOR DELETE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);
