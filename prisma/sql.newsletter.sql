-- Newsletter subscriptions table with RLS policies
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

-- Newsletter RLS Policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter;

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter FOR INSERT WITH CHECK (true);
