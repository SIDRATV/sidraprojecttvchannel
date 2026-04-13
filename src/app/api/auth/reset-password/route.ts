import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Look up user by email
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (!userData) {
      return NextResponse.json({ success: true });
    }

    // Generate a password reset link using Supabase Admin API
    // Use NEXT_PUBLIC_SITE_URL (production domain) as the canonical base
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';
    const redirectTo = `${siteUrl.replace(/\/$/, '')}/reset-password`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[Password Reset] Link generation error:', linkError?.message);
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Send the email through Resend (non-blocking failure — always return success)
    const result = await sendPasswordResetEmail(
      cleanEmail,
      linkData.properties.action_link,
      userData.full_name || undefined,
      userData.id
    );

    if (!result.success) {
      console.error('[Password Reset] Email send error:', result.error);
      // Return success anyway — don't expose internal email failures
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Password Reset] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
