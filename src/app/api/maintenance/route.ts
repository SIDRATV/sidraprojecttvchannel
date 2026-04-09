import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/maintenance — public endpoint to check maintenance status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (error || !data) {
      return NextResponse.json({ enabled: false });
    }

    const settings = data.value as { enabled: boolean; message: string; exempt_user_ids: string[] };

    // For unauthenticated public requests, only return enabled + message
    // Check if user is exempt via auth header
    const authHeader = request.headers.get('authorization');
    let isExempt = false;

    if (authHeader?.startsWith('Bearer ') && settings.enabled) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user && settings.exempt_user_ids?.includes(user.id)) {
          isExempt = true;
        }
      } catch {
        // Ignore auth errors for public endpoint
      }
    }

    return NextResponse.json({
      enabled: settings.enabled,
      message: settings.message,
      isExempt,
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
