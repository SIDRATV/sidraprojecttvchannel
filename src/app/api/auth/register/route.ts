import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { provisionUserWallet } from '@/lib/wallet';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, username } = body;

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
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    try {
      await provisionUserWallet(authData.user.id);
    } catch {
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to provision wallet account. Please try again.' },
        { status: 500 }
      );
    }

    // Auto sign-in after registration so the client gets a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

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
