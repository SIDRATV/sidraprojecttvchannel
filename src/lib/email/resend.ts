import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase';

// ─── Singleton ────────────────────────────────────────────
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ─── Types ────────────────────────────────────────────────
export interface EmailSettings {
  id: string;
  sender_name: string;
  sender_email: string;
  reply_to_email: string | null;
  event_password_reset: boolean;
  event_password_changed: boolean;
  event_email_changed: boolean;
  event_signup_welcome: boolean;
  event_login_alert: boolean;
  event_mfa_enabled: boolean;
  event_mfa_disabled: boolean;
  max_bulk_emails_per_hour: number;
  max_single_emails_per_minute: number;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  description: string | null;
  variables: string[];
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  to_email: string;
  to_user_id: string | null;
  from_email: string;
  subject: string;
  template_slug: string | null;
  resend_id: string | null;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  error_message: string | null;
  metadata: Record<string, unknown>;
  sent_by: string | null;
  created_at: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  toUserId?: string;
  templateSlug?: string;
  sentBy?: string;
  replyTo?: string;
}

// ─── Settings cache (5 min) ──────────────────────────────
let _settingsCache: { data: EmailSettings; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function getEmailSettings(): Promise<EmailSettings> {
  if (_settingsCache && Date.now() - _settingsCache.ts < CACHE_TTL) {
    return _settingsCache.data;
  }
  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from('email_settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // Return defaults if no settings row
    return {
      id: '',
      sender_name: 'Sidra TV',
      sender_email: 'noreply@sidratv.com',
      reply_to_email: null,
      event_password_reset: true,
      event_password_changed: true,
      event_email_changed: true,
      event_signup_welcome: true,
      event_login_alert: false,
      event_mfa_enabled: false,
      event_mfa_disabled: false,
      max_bulk_emails_per_hour: 200,
      max_single_emails_per_minute: 10,
    };
  }

  _settingsCache = { data: data as EmailSettings, ts: Date.now() };
  return data as EmailSettings;
}

export function invalidateSettingsCache() {
  _settingsCache = null;
}

// ─── Template engine ─────────────────────────────────────
export function renderTemplate(
  html: string,
  variables: Record<string, string>
): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    // Sanitize value to prevent HTML injection
    const safeValue = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    result = result.replace(new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, 'g'), safeValue);
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Get template by slug ────────────────────────────────
export async function getTemplate(slug: string): Promise<EmailTemplate | null> {
  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as EmailTemplate;
}

// ─── Core send function ──────────────────────────────────
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; resendId?: string; error?: string }> {
  const settings = await getEmailSettings();
  const resend = getResend();

  const from = `${settings.sender_name} <${settings.sender_email}>`;
  const replyTo = opts.replyTo || settings.reply_to_email || undefined;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      replyTo: replyTo || undefined,
    });

    const supabase = createServerClient();
    const resendId = data?.id || null;
    const status = error ? 'failed' : 'sent';

    // Log the email
    await (supabase as any).from('email_logs').insert({
      to_email: opts.to,
      to_user_id: opts.toUserId || null,
      from_email: settings.sender_email,
      subject: opts.subject,
      template_slug: opts.templateSlug || null,
      resend_id: resendId,
      status,
      error_message: error?.message || null,
      sent_by: opts.sentBy || null,
      metadata: {},
    });

    if (error) {
      console.error('[Email] Resend error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, resendId: resendId || undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Send error:', message);

    // Log failure
    const supabase = createServerClient();
    await (supabase as any).from('email_logs').insert({
      to_email: opts.to,
      to_user_id: opts.toUserId || null,
      from_email: settings.sender_email,
      subject: opts.subject,
      template_slug: opts.templateSlug || null,
      resend_id: null,
      status: 'failed',
      error_message: message,
      sent_by: opts.sentBy || null,
      metadata: {},
    }).catch(() => { /* ignore logging errors */ });

    return { success: false, error: message };
  }
}

// ─── Send templated email ────────────────────────────────
export async function sendTemplatedEmail(
  templateSlug: string,
  to: string,
  variables: Record<string, string>,
  extra?: { toUserId?: string; sentBy?: string }
): Promise<{ success: boolean; error?: string }> {
  const template = await getTemplate(templateSlug);
  if (!template) {
    return { success: false, error: `Template "${templateSlug}" not found or inactive` };
  }

  const subject = renderTemplate(template.subject, variables);
  const html = renderTemplate(template.html_body, variables);

  return sendEmail({
    to,
    subject,
    html,
    templateSlug,
    toUserId: extra?.toUserId,
    sentBy: extra?.sentBy,
  });
}

// ─── Event-based email helpers ───────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getEmailSettings();
  if (!settings.event_password_reset) {
    return { success: true }; // Silently skip if disabled
  }

  const appName = settings.sender_name || 'Sidra TV';

  return sendTemplatedEmail('password_reset', email, {
    'user.name': userName || 'Utilisateur',
    'user.email': email,
    'app.name': appName,
    resetLink,
  }, { toUserId: userId });
}

export async function sendPasswordChangedEmail(
  email: string,
  userName?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getEmailSettings();
  if (!settings.event_password_changed) return { success: true };

  return sendTemplatedEmail('password_changed', email, {
    'user.name': userName || 'Utilisateur',
    'user.email': email,
    'app.name': settings.sender_name || 'Sidra TV',
  }, { toUserId: userId });
}

export async function sendWelcomeEmail(
  email: string,
  userName: string,
  appUrl: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getEmailSettings();
  if (!settings.event_signup_welcome) return { success: true };

  return sendTemplatedEmail('welcome', email, {
    'user.name': userName,
    'user.email': email,
    'app.name': settings.sender_name || 'Sidra TV',
    'app.url': appUrl,
  }, { toUserId: userId });
}

export async function sendEmailChangedNotification(
  email: string,
  userName?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getEmailSettings();
  if (!settings.event_email_changed) return { success: true };

  return sendTemplatedEmail('email_changed', email, {
    'user.name': userName || 'Utilisateur',
    'user.email': email,
    'app.name': settings.sender_name || 'Sidra TV',
  }, { toUserId: userId });
}
