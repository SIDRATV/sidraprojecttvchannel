-- Default categories data
INSERT INTO categories (name, description, icon, color) VALUES
  ('Documentaries', 'In-depth Islamic documentaries and educational content', 'Film', '#5b63f5'),
  ('Tutorials', 'Technology and Sidra ecosystem tutorials', 'Lightbulb', '#f59e0b'),
  ('News', 'Latest updates and news from the Sidra ecosystem', 'AlertCircle', '#16a34a'),
  ('Interviews', 'In-depth interviews with industry leaders', 'Mic2', '#14b8a6'),
  ('Inspirational', 'Islamic inspirational and motivational content', 'Heart', '#ec4899'),
  ('Technology', 'Technology innovation within Islam', 'Zap', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
