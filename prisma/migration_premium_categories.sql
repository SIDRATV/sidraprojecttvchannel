-- Migration: Insert premium content categories
-- Run this in Supabase SQL Editor
-- Idempotent: uses ON CONFLICT (name) DO NOTHING

INSERT INTO categories (name, description, icon, color) VALUES
  ('Films',         'Films et long-métrages premium',      '🎬', '#F59E0B'),
  ('Séries',        'Séries TV exclusives',                '📺', '#8B5CF6'),
  ('Sport',         'Contenu sportif premium',             '⚽', '#10B981'),
  ('Anime',         'Animés et dessins animés premium',    '⭐', '#EC4899'),
  ('Documentaires', 'Documentaires exclusifs',             '🎥', '#3B82F6'),
  ('Enfants',       'Contenu éducatif pour enfants',       '🧒', '#F97316'),
  ('Masterclasses', 'Formations et masterclasses premium', '🎓', '#6366F1')
ON CONFLICT (name) DO NOTHING;
