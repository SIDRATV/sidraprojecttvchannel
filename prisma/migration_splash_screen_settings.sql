-- ============================================================
-- SPLASH SCREEN SETTINGS
-- ============================================================

INSERT INTO site_settings (key, value)
VALUES (
  'splash_screen',
  '{
    "enabled": true,
    "duration": 4,
    "title": "SIDRA PROJECTS TV CHANNEL",
    "slogan": "L''information à la source",
    "backgroundType": "gradient",
    "backgroundColor": "#000000",
    "backgroundGradient": "radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(217, 119, 6, 0.08) 30%, rgba(15, 23, 42, 0.95) 100%)",
    "backgroundImage": "",
    "textColor": "#ffffff",
    "showParticles": true,
    "showFooter": true,
    "footerText": "Powered by SidraChain"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
