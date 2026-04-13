import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { sendEmail, sendTemplatedEmail, renderTemplate, getTemplate, getEmailSettings } from '@/lib/email/resend';

// POST — Send email (single or bulk)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { mode } = body; // 'single' | 'bulk' | 'template'

  if (mode === 'single') {
    return handleSingleSend(body, auth);
  } else if (mode === 'bulk') {
    return handleBulkSend(body, auth);
  } else if (mode === 'template') {
    return handleTemplateSend(body, auth);
  }

  return NextResponse.json({ error: 'Invalid mode. Use: single, bulk, or template' }, { status: 400 });
}

async function handleSingleSend(
  body: { to: string; subject: string; html: string },
  auth: { ok: true; admin: { id: string }; supabase: ReturnType<typeof import('@/lib/supabase').createServerClient> }
) {
  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'to, subject, and html required' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject,
    html,
    sentBy: auth.admin.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, resendId: result.resendId });
}

async function handleBulkSend(
  body: { subject: string; html: string; filter?: string; templateSlug?: string },
  auth: { ok: true; admin: { id: string }; supabase: ReturnType<typeof import('@/lib/supabase').createServerClient> }
) {
  const { subject, html, filter } = body;

  if (!subject || !html) {
    return NextResponse.json({ error: 'subject and html required' }, { status: 400 });
  }

  // Rate limit check
  const settings = await getEmailSettings();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await auth.supabase
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo);

  if ((count || 0) >= settings.max_bulk_emails_per_hour) {
    return NextResponse.json(
      { error: `Rate limit: max ${settings.max_bulk_emails_per_hour} emails/hour reached` },
      { status: 429 }
    );
  }

  // Fetch target users
  let query = auth.supabase.from('users').select('id, email, full_name');

  if (filter === 'admins') {
    query = query.eq('is_admin', true);
  }
  // add more filters as needed

  const { data: users, error } = await query;

  if (error || !users?.length) {
    return NextResponse.json({ error: 'No users found' }, { status: 404 });
  }

  // Cap to rate limit
  const remaining = settings.max_bulk_emails_per_hour - (count || 0);
  const usersToEmail = users.slice(0, remaining);

  let sent = 0;
  let failed = 0;

  for (const user of usersToEmail) {
    const personalizedHtml = renderTemplate(html, {
      'user.name': user.full_name || 'Utilisateur',
      'user.email': user.email,
      'app.name': settings.sender_name || 'Sidra TV',
    });

    const personalizedSubject = renderTemplate(subject, {
      'user.name': user.full_name || 'Utilisateur',
      'app.name': settings.sender_name || 'Sidra TV',
    });

    const result = await sendEmail({
      to: user.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      toUserId: user.id,
      sentBy: auth.admin.id,
    });

    if (result.success) sent++;
    else failed++;
  }

  return NextResponse.json({
    success: true,
    total: usersToEmail.length,
    sent,
    failed,
    skipped: users.length - usersToEmail.length,
  });
}

async function handleTemplateSend(
  body: { templateSlug: string; to: string; variables?: Record<string, string> },
  auth: { ok: true; admin: { id: string }; supabase: ReturnType<typeof import('@/lib/supabase').createServerClient> }
) {
  const { templateSlug, to, variables = {} } = body;

  if (!templateSlug || !to) {
    return NextResponse.json({ error: 'templateSlug and to required' }, { status: 400 });
  }

  const settings = await getEmailSettings();
  const allVars = {
    'app.name': settings.sender_name || 'Sidra TV',
    ...variables,
  };

  const result = await sendTemplatedEmail(templateSlug, to, allVars, {
    sentBy: auth.admin.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
