import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { provisionUserWallet } from '@/lib/wallet';
import { sendWelcomeEmail } from '@/lib/email/resend';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, username, referralCode } = body;

    if (!email || !password || !fullName || !username) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 characters (letters, numbers, underscores only)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const normalizedUsername = username.toLowerCase().trim();

    // Check username uniqueness before creating auth user
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingByUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Check email uniqueness
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingByEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create auth user via admin API (service role)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username: normalizedUsername },
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    // Insert user profile with service role (bypasses RLS)
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: email.toLowerCase().trim(),
      full_name: fullName.trim(),
      username: normalizedUsername,
    });

    if (profileError) {
      // Rollback: delete auth user so the account doesn't hang
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    try {
      await provisionUserWallet(authData.user.id);
    } catch (walletError: any) {
      // Wallet provisioning is non-critical at registration time.
      // The wallet will be auto-provisioned on first wallet page visit.
      // Do NOT roll back user creation — the account is usable without a wallet.
      console.error('Wallet provisioning failed during registration (non-fatal):', walletError?.message);
    }

    // Process referral if a code was provided
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      try {
        const trimmedCode = referralCode.trim().toLowerCase();
        // Cast to any — new referral tables are not yet in the generated Supabase types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data: refCodeRow } = await db
          .from('referral_codes')
          .select('user_id')
          .eq('code', trimmedCode)
          .maybeSingle();

        const referrerId = refCodeRow?.user_id;
        if (referrerId && referrerId !== authData.user.id) {
          // Register the referral (status = pending until they subscribe to premium)
          await db.from('referrals').insert({
            referrer_id: referrerId,
            referred_id: authData.user.id,
            status: 'pending',
          });
        }
      } catch (refErr: any) {
        console.error('Referral tracking failed (non-fatal):', refErr?.message);
      }
    }

    // Auto sign-in after registration so the client gets a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    // Send welcome email (non-blocking)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    sendWelcomeEmail(
      email.toLowerCase().trim(),
      fullName.trim(),
      origin,
      authData.user.id
    ).catch((err) => console.error('Welcome email failed (non-fatal):', err));

    if (signInError || !signInData?.session) {
      // Account created but auto sign-in failed — user can log in manually
      return NextResponse.json({ success: true, session: null });
    }

    return NextResponse.json({ success: true, session: signInData.session });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
