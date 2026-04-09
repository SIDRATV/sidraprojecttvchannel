import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/maintenance — get full maintenance settings (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) {
      return NextResponse.json({
        enabled: false,
        message: 'Nous sommes en maintenance, nous reviendrons bientôt. Merci pour votre patience.',
        exempt_user_ids: [],
      });
    }

    return NextResponse.json(data.value);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/admin/maintenance — update maintenance settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { enabled, message, exempt_user_ids } = body;

    // Get current settings
    const { data: current } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    const currentValue = (current?.value as any) || {
      enabled: false,
      message: 'Nous sommes en maintenance, nous reviendrons bientôt. Merci pour votre patience.',
      exempt_user_ids: [],
    };

    // Merge updates
    const newValue = {
      enabled: enabled !== undefined ? enabled : currentValue.enabled,
      message: message !== undefined ? message : currentValue.message,
      exempt_user_ids: exempt_user_ids !== undefined ? exempt_user_ids : currentValue.exempt_user_ids,
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'maintenance_mode',
        value: newValue,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...newValue });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
