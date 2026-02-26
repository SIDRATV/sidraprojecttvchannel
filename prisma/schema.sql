-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
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

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id)
);

-- Newsletter subscriptions table
CREATE TABLE newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  avg_watch_time INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_created_by ON videos(created_by);
CREATE INDEX idx_videos_is_featured ON videos(is_featured);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_video_id ON likes(video_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_analytics_video_id ON analytics(video_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Videos RLS policies
CREATE POLICY "Videos are publicly readable" ON videos FOR SELECT USING (true);

CREATE POLICY "Users can insert their own videos"
  ON videos FOR INSERT 
  WITH CHECK (auth.uid() = created_by AND (SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Users can update their own videos"
  ON videos FOR UPDATE 
  USING (auth.uid() = created_by OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true)
  WITH CHECK (auth.uid() = created_by OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true);

CREATE POLICY "Admins can delete videos"
  ON videos FOR DELETE 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

-- Comments RLS policies
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Likes RLS policies
CREATE POLICY "Likes are publicly readable" ON likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE 
  USING (auth.uid() = user_id);

-- Categories RLS policies
CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR INSERT 
  WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) = true);

-- Newsletter RLS policies
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter FOR INSERT WITH CHECK (true);

-- Users table RLS policies
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id OR true);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Documentaries', 'In-depth Islamic documentaries and educational content', 'Film', '#5b63f5'),
  ('Tutorials', 'Technology and Sidra ecosystem tutorials', 'Lightbulb', '#f59e0b'),
  ('News', 'Latest updates and news from the Sidra ecosystem', 'AlertCircle', '#16a34a'),
  ('Interviews', 'In-depth interviews with industry leaders', 'Mic2', '#14b8a6'),
  ('Inspirational', 'Islamic inspirational and motivational content', 'Heart', '#ec4899'),
  ('Technology', 'Technology innovation within Islam', 'Zap', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
