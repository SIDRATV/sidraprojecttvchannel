-- ============================================================
-- NEWS / ACTUALITÉS SYSTEM
-- ============================================================

-- Table: news_articles
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  author TEXT NOT NULL DEFAULT 'Rédaction Sidra',
  image_url TEXT DEFAULT '',
  read_time INT NOT NULL DEFAULT 3,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: news_article_likes
CREATE TABLE IF NOT EXISTS news_article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Table: news_article_comments
CREATE TABLE IF NOT EXISTS news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(featured);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_article_likes_article ON news_article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_news_article_likes_user ON news_article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_article ON news_article_comments(article_id);

-- RLS policies
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_article_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read published articles
CREATE POLICY "news_articles_select" ON news_articles FOR SELECT USING (true);

-- Only admins can insert/update/delete articles
CREATE POLICY "news_articles_admin_insert" ON news_articles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "news_articles_admin_update" ON news_articles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "news_articles_admin_delete" ON news_articles FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Authenticated users can like
CREATE POLICY "news_article_likes_select" ON news_article_likes FOR SELECT USING (true);
CREATE POLICY "news_article_likes_insert" ON news_article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "news_article_likes_delete" ON news_article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Authenticated users can comment
CREATE POLICY "news_article_comments_select" ON news_article_comments FOR SELECT USING (true);
CREATE POLICY "news_article_comments_insert" ON news_article_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "news_article_comments_delete" ON news_article_comments FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
