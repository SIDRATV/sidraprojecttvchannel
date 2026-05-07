import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

// GET /api/notifications/preferences — fetch user notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwtPayload.sub, email: jwtPayload.email };

    // Fetch user's notification preferences from localStorage on client
    // or from a new notification_preferences table if adding to DB
    const { data, error } = await (supabase as any)
      .from('users')
      .select('notifications_enabled')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      notifications_enabled: data?.notifications_enabled ?? true,
      // Client-side localStorage stores these:
      preferences: {
        new_video: true,
        transactions: true,
        subscriptions: true,
        system: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/notifications/preferences — update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = { id: jwtPayload.sub, email: jwtPayload.email };

    const body = await request.json();
    const { notifications_enabled, preferences } = body;

    // Update main toggle
    if (notifications_enabled !== undefined) {
      const { error } = await (supabase as any)
        .from('users')
        .update({ notifications_enabled })
        .eq('id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Note: Type-specific preferences are stored client-side in localStorage
    // Example keys: settings_notif_new_video, settings_notif_transactions, etc.
    
    return NextResponse.json({
      success: true,
      notifications_enabled,
      preferences,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
