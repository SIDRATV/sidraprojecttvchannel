-- Add to migration_referral_system.sql or run separately
-- Increment click counter on referral link visits
CREATE OR REPLACE FUNCTION increment_referral_clicks(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes SET total_clicks = total_clicks + 1 WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
