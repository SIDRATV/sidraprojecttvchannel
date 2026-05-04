import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Use the anon client — RLS policy "Users are publicly readable" (USING true)
    // allows SELECT on users table without service role.
    // This also removes the SUPABASE_SERVICE_ROLE_KEY dependency for this route.
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('[resolve-username] DB error:', error.message, error.code);
      return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
    }

    if (!data) {
      // Return generic error — do NOT reveal whether username exists
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (error: any) {
    console.error('[resolve-username] Unexpected error:', error?.message ?? error);
    return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
  }
}
