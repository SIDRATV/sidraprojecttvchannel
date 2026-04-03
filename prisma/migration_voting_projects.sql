-- ============================================================
-- VOTING PROJECTS SYSTEM
-- ============================================================

-- Table: voting_projects
CREATE TABLE IF NOT EXISTS voting_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT DEFAULT '',
  funding_goal NUMERIC(18,2) NOT NULL DEFAULT 0,
  funding_current NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'completed', 'rejected')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: voting_project_votes
CREATE TABLE IF NOT EXISTS voting_project_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES voting_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voting_projects_status ON voting_projects(status);
CREATE INDEX IF NOT EXISTS idx_voting_projects_ends_at ON voting_projects(ends_at);
CREATE INDEX IF NOT EXISTS idx_voting_project_votes_project ON voting_project_votes(project_id);
CREATE INDEX IF NOT EXISTS idx_voting_project_votes_user ON voting_project_votes(user_id);

-- View: voting project stats (upvotes, downvotes, total)
CREATE OR REPLACE VIEW voting_project_stats AS
SELECT
  vp.id AS project_id,
  COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0)::INT AS upvotes,
  COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0)::INT AS downvotes,
  COUNT(v.id)::INT AS total_votes
FROM voting_projects vp
LEFT JOIN voting_project_votes v ON v.project_id = vp.id
GROUP BY vp.id;

-- RLS policies
ALTER TABLE voting_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_project_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can read projects
CREATE POLICY "voting_projects_select" ON voting_projects FOR SELECT USING (true);

-- Only admins can insert/update/delete projects
CREATE POLICY "voting_projects_admin_insert" ON voting_projects FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "voting_projects_admin_update" ON voting_projects FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "voting_projects_admin_delete" ON voting_projects FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Authenticated users can vote
CREATE POLICY "voting_project_votes_select" ON voting_project_votes FOR SELECT USING (true);
CREATE POLICY "voting_project_votes_insert" ON voting_project_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voting_project_votes_update" ON voting_project_votes FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "voting_project_votes_delete" ON voting_project_votes FOR DELETE
  USING (auth.uid() = user_id);
