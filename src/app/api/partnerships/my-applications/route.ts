import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/partnerships/my-applications — get current user's applications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: applications, error } = await (supabase as any)
      .from('partnership_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: applications || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/partnerships/my-applications — user resubmits a correction_needed application
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { id, project_name, owner_name, owner_email, domain, redirect_link,
            benefits, countries, sda_amount, has_team_in_5_countries, has_sda_2000_plus } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Verify the application belongs to this user and is in correction_needed status
    const { data: existing, error: fetchErr } = await (supabase as any)
      .from('partnership_applications')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !existing) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    if (existing.status !== 'correction_needed') {
      return NextResponse.json({ error: 'Only applications with status correction_needed can be updated' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('partnership_applications')
      .update({
        project_name, owner_name, owner_email, domain, redirect_link,
        benefits, countries, sda_amount, has_team_in_5_countries, has_sda_2000_plus,
        status: 'pending', // Reset to pending after correction
        correction_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, application: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
