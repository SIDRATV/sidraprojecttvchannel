-- ============================================================
-- EMAIL SYSTEM TABLES
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Email Settings (singleton config row)
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL DEFAULT 'Sidra TV',
  sender_email TEXT NOT NULL DEFAULT 'noreply@sidratv.com',
  reply_to_email TEXT DEFAULT NULL,
  -- Event toggles
  event_password_reset BOOLEAN NOT NULL DEFAULT true,
  event_password_changed BOOLEAN NOT NULL DEFAULT true,
  event_email_changed BOOLEAN NOT NULL DEFAULT true,
  event_signup_welcome BOOLEAN NOT NULL DEFAULT true,
  event_login_alert BOOLEAN NOT NULL DEFAULT false,
  event_mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  event_mfa_disabled BOOLEAN NOT NULL DEFAULT false,
  -- Rate limits
  max_bulk_emails_per_hour INTEGER NOT NULL DEFAULT 200,
  max_single_emails_per_minute INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO email_settings (sender_name, sender_email)
VALUES ('Sidra TV', 'noreply@play.affilwin.com')
ON CONFLICT DO NOTHING;

-- 2. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g. 'password_reset', 'welcome', 'custom'
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  variables TEXT[] DEFAULT '{}', -- available variables like '{user.name,user.email,app.name}'
  is_system BOOLEAN NOT NULL DEFAULT false, -- system templates can't be deleted
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (slug, name, subject, html_body, description, variables, is_system) VALUES
(
  'password_reset',
  'Réinitialisation de mot de passe',
  'Réinitialisez votre mot de passe - {{app.name}}',
  '<div style="font-family:''Segoe UI'',Tahoma,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#19C37D;font-size:28px;margin:0;">{{app.name}}</h1>
  </div>
  <div style="background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Réinitialisation de mot de passe</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Bonjour {{user.name}},<br><br>
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer :
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{resetLink}}" style="background:#19C37D;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;">
      Si vous n''avez pas fait cette demande, ignorez cet email. Ce lien expire dans 10 minutes.
    </p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
    © 2025 {{app.name}}. Tous droits réservés.
  </p>
</div>',
  'Email envoyé quand un utilisateur demande la réinitialisation de son mot de passe',
  '{user.name,user.email,app.name,resetLink}',
  true
),
(
  'password_changed',
  'Mot de passe modifié',
  'Votre mot de passe a été modifié - {{app.name}}',
  '<div style="font-family:''Segoe UI'',Tahoma,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#19C37D;font-size:28px;margin:0;">{{app.name}}</h1>
  </div>
  <div style="background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Mot de passe modifié</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Bonjour {{user.name}},<br><br>
      Votre mot de passe a été modifié avec succès. Si ce n''est pas vous, contactez-nous immédiatement.
    </p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
    © 2025 {{app.name}}. Tous droits réservés.
  </p>
</div>',
  'Email envoyé après modification du mot de passe',
  '{user.name,user.email,app.name}',
  true
),
(
  'welcome',
  'Bienvenue',
  'Bienvenue sur {{app.name}} !',
  '<div style="font-family:''Segoe UI'',Tahoma,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#19C37D;font-size:28px;margin:0;">{{app.name}}</h1>
  </div>
  <div style="background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Bienvenue {{user.name}} !</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Votre compte a été créé avec succès. Découvrez nos contenus vidéo premium et bien plus encore.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{{app.url}}/dashboard" style="background:#19C37D;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Accéder à mon compte
      </a>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
    © 2025 {{app.name}}. Tous droits réservés.
  </p>
</div>',
  'Email de bienvenue envoyé à l''inscription',
  '{user.name,user.email,app.name,app.url}',
  true
),
(
  'email_changed',
  'Email modifié',
  'Votre adresse email a été modifiée - {{app.name}}',
  '<div style="font-family:''Segoe UI'',Tahoma,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#19C37D;font-size:28px;margin:0;">{{app.name}}</h1>
  </div>
  <div style="background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Adresse email modifiée</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Bonjour {{user.name}},<br><br>
      Votre adresse email a été modifiée avec succès. Si ce n''est pas vous, contactez-nous immédiatement.
    </p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
    © 2025 {{app.name}}. Tous droits réservés.
  </p>
</div>',
  'Email envoyé quand l''utilisateur change son adresse email',
  '{user.name,user.email,app.name}',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_user_id UUID DEFAULT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_slug TEXT DEFAULT NULL,
  resend_id TEXT DEFAULT NULL, -- Resend message ID for tracking
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  sent_by UUID DEFAULT NULL, -- admin who triggered it (NULL for system)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);

-- RLS Policies
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables (backend only)
DROP POLICY IF EXISTS "Service role full access on email_settings" ON email_settings;
CREATE POLICY "Service role full access on email_settings"
  ON email_settings FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on email_templates" ON email_templates;
CREATE POLICY "Service role full access on email_templates"
  ON email_templates FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on email_logs" ON email_logs;
CREATE POLICY "Service role full access on email_logs"
  ON email_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_settings_updated_at ON email_settings;
CREATE TRIGGER email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_email_updated_at();
