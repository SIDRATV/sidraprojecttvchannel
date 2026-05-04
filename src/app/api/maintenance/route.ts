import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/maintenance — public endpoint to check maintenance status
export async function GET(request: NextRequest) {
  // Hard timeout: if Supabase is slow, never hang the client more than 5 s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

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
        // getUser also gets a timeout from the shared AbortController above (already cleared,
        // so create a fresh one scoped to this auth check only)
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 3_000);
        const { data: { user } } = await supabase.auth.getUser(token);
        clearTimeout(authTimeout);
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
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Timeout or network error → treat as maintenance disabled so the site stays up
    if (err?.name === 'AbortError') {
      console.warn('[maintenance] Supabase query timed out, defaulting to enabled:false');
    }
    return NextResponse.json({ enabled: false });
  }
}

