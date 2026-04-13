import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { invalidateSettingsCache } from '@/lib/email/resend';

// GET — Fetch email settings
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from('email_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT — Update email settings
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();

  // Allowlist of fields that can be updated
  const allowed = [
    'sender_name', 'sender_email', 'reply_to_email',
    'event_password_reset', 'event_password_changed',
    'event_email_changed', 'event_signup_welcome',
    'event_login_alert', 'event_mfa_enabled', 'event_mfa_disabled',
    'max_bulk_emails_per_hour', 'max_single_emails_per_minute',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Get the settings row ID
  const { data: current } = await auth.supabase
    .from('email_settings')
    .select('id')
    .limit(1)
    .single();

  if (!current) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from('email_settings')
    .update(updates)
    .eq('id', current.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  invalidateSettingsCache();

  return NextResponse.json(data);
}
