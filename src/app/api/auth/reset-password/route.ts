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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[Password Reset] Link generation error:', linkError?.message);
      return NextResponse.json({ success: true });
    }

    // Extract the token from Supabase's action_link.
    // action_link format: https://xxx.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=...
    // We build our OWN direct link to /reset-password with the token_hash.
    // This completely bypasses Supabase's redirect URL whitelist.
    const actionUrl = new URL(linkData.properties.action_link);
    const token = actionUrl.searchParams.get('token');

    if (!token) {
      console.error('[Password Reset] No token in action_link');
      return NextResponse.json({ success: true });
    }

    // Direct link to our reset-password page with token_hash as query param
    const resetLink = `${siteUrl.replace(/\/$/, '')}/reset-password?token_hash=${encodeURIComponent(token)}&type=recovery`;

    // Send the email through Resend
    const result = await sendPasswordResetEmail(
      cleanEmail,
      resetLink,
      userData.full_name || undefined,
      userData.id
    );

    if (!result.success) {
      console.error('[Password Reset] Email send error:', result.error);
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
