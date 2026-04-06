-- ============================================================
-- PARTNERSHIP SYSTEM
-- ============================================================

-- Table: partners (approved/featured partners displayed publicly)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Technologie',
  logo_emoji TEXT DEFAULT '🤝',
  logo_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  followers_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'featured', 'inactive')),
  benefits TEXT[] DEFAULT '{}',
  join_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: partnership_applications (user-submitted requests)
CREATE TABLE IF NOT EXISTS partnership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  partnership_type TEXT NOT NULL CHECK (partnership_type IN ('advertising', 'project')),
  domain TEXT DEFAULT '',
  redirect_link TEXT DEFAULT '',
  benefits TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  sda_amount NUMERIC(18,2) DEFAULT 0,
  has_team_in_5_countries BOOLEAN DEFAULT false,
  has_sda_2000_plus BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_status ON partnership_applications(status);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_user ON partnership_applications(user_id);

-- RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_applications ENABLE ROW LEVEL SECURITY;

-- Everyone can read active partners
CREATE POLICY "partners_select" ON partners FOR SELECT USING (true);

-- Only admins can manage partners
CREATE POLICY "partners_admin_insert" ON partners FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "partners_admin_update" ON partners FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "partners_admin_delete" ON partners FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Users can read their own applications, admins can read all
CREATE POLICY "partnership_applications_select" ON partnership_applications FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Authenticated users can submit applications
CREATE POLICY "partnership_applications_insert" ON partnership_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update applications (approve/reject)
CREATE POLICY "partnership_applications_admin_update" ON partnership_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Only admins can delete applications
CREATE POLICY "partnership_applications_admin_delete" ON partnership_applications FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
