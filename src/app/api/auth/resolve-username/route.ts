import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Resolve username error:', error);
      return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
    }

    if (!data) {
      // Return generic error — do NOT reveal whether username exists
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (error: any) {
    console.error('Resolve username error:', error);
    return NextResponse.json({ error: 'Failed to resolve username' }, { status: 500 });
  }
}
