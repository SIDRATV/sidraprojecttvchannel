import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lightweight server-side anon client — no browser auth persistence
function createAnonClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('[resolve-username] DB error:', JSON.stringify(error));
      return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
    }

    if (!data) {
      // Return generic error — do NOT reveal whether username exists
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (err: any) {
    console.error('[resolve-username] Unexpected error:', err?.message ?? String(err));
    return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
  }
}
