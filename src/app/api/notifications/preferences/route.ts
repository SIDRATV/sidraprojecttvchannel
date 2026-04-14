import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/notifications/preferences — fetch user notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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
