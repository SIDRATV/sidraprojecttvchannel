-- ============================================================
-- SURVEYS SYSTEM — Run in Supabase SQL Editor
-- ============================================================

-- 1. Surveys table (admin-created)
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- questions format: [{ "id": "q1", "text": "...", "type": "choice|text|rating", "options": ["A","B","C"] }]
  reward_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'SPTC',
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  min_plan TEXT DEFAULT 'pro' CHECK (min_plan IN ('pro', 'premium', 'vip')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_responses INTEGER,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_min_plan ON surveys(min_plan);

-- 2. Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- answers format: { "q1": "Option A", "q2": "free text", "q3": 4 }
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);

-- 3. RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Everyone can read active surveys
DROP POLICY IF EXISTS "Anyone can read active surveys" ON surveys;
CREATE POLICY "Anyone can read active surveys" ON surveys
  FOR SELECT USING (is_active = TRUE);

-- Admins can manage surveys
DROP POLICY IF EXISTS "Admins manage surveys" ON surveys;
CREATE POLICY "Admins manage surveys" ON surveys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Service role full access
DROP POLICY IF EXISTS "Service role manages surveys" ON surveys;
CREATE POLICY "Service role manages surveys" ON surveys
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can read own responses
DROP POLICY IF EXISTS "Users read own responses" ON survey_responses;
CREATE POLICY "Users read own responses" ON survey_responses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own responses
DROP POLICY IF EXISTS "Users insert own responses" ON survey_responses;
CREATE POLICY "Users insert own responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role manages responses" ON survey_responses;
CREATE POLICY "Service role manages responses" ON survey_responses
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Auto-update timestamp
CREATE OR REPLACE FUNCTION update_surveys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_surveys_updated ON surveys;
CREATE TRIGGER trg_surveys_updated
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_surveys_timestamp();

-- 5. Function: get surveys available to a user based on their plan
CREATE OR REPLACE FUNCTION get_available_surveys(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  questions JSONB,
  reward_amount NUMERIC,
  reward_currency TEXT,
  duration_minutes INTEGER,
  min_plan TEXT,
  question_count INTEGER,
  already_responded BOOLEAN,
  total_responses BIGINT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_plan TEXT;
  v_plan_rank INTEGER;
BEGIN
  -- Get user's plan
  SELECT COALESCE(u.premium_plan, '') INTO v_user_plan FROM users u WHERE u.id = p_user_id;

  -- Rank plans: pro=1, premium=2, vip=3
  v_plan_rank := CASE v_user_plan
    WHEN 'vip' THEN 3
    WHEN 'premium' THEN 2
    WHEN 'pro' THEN 1
    ELSE 0
  END;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.questions,
    s.reward_amount,
    s.reward_currency,
    s.duration_minutes,
    s.min_plan,
    jsonb_array_length(s.questions)::INTEGER AS question_count,
    EXISTS(SELECT 1 FROM survey_responses sr WHERE sr.survey_id = s.id AND sr.user_id = p_user_id) AS already_responded,
    (SELECT COUNT(*) FROM survey_responses sr2 WHERE sr2.survey_id = s.id) AS total_responses,
    s.created_at
  FROM surveys s
  WHERE s.is_active = TRUE
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
    AND (s.max_responses IS NULL OR (SELECT COUNT(*) FROM survey_responses sr3 WHERE sr3.survey_id = s.id) < s.max_responses)
    AND v_plan_rank >= CASE s.min_plan
      WHEN 'vip' THEN 3
      WHEN 'premium' THEN 2
      WHEN 'pro' THEN 1
      ELSE 0
    END
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
