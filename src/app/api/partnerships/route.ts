import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/partnerships — public: list active/featured partners
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: partners, error } = await (supabase as any)
      .from('partners')
      .select('*')
      .in('status', ['active', 'featured'])
      .order('status', { ascending: true }) // featured first
      .order('rating', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ partners: partners || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/partnerships — authenticated user submits a partnership application
export async function POST(request: NextRequest) {
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
    const {
      project_name, owner_name, owner_email, partnership_type,
      domain, redirect_link, benefits, countries,
      sda_amount, has_team_in_5_countries, has_sda_2000_plus,
    } = body;

    if (!project_name || !owner_name || !owner_email || !partnership_type) {
      return NextResponse.json({ error: 'project_name, owner_name, owner_email, and partnership_type are required' }, { status: 400 });
    }

    if (!['advertising', 'project'].includes(partnership_type)) {
      return NextResponse.json({ error: 'partnership_type must be advertising or project' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('partnership_applications')
      .insert({
        user_id: user.id,
        project_name,
        owner_name,
        owner_email,
        partnership_type,
        domain: domain || '',
        redirect_link: redirect_link || '',
        benefits: benefits || [],
        countries: countries || [],
        sda_amount: sda_amount || 0,
        has_team_in_5_countries: has_team_in_5_countries || false,
        has_sda_2000_plus: has_sda_2000_plus || false,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
