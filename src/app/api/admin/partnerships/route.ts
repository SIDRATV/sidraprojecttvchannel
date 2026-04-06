import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/partnerships — list all partners + applications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'partners', 'applications', 'all'

    let partners = null;
    let applications = null;

    if (type === 'partners' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      partners = data;
    }

    if (type === 'applications' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('partnership_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      applications = data;
    }

    return NextResponse.json({ partners, applications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/partnerships — create a new partner
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, description, category, logo_emoji, logo_url, website_url, status, benefits } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('partners')
      .insert({
        name,
        description: description || '',
        category: category || 'Technologie',
        logo_emoji: logo_emoji || '🤝',
        logo_url: logo_url || '',
        website_url: website_url || '',
        status: status || 'active',
        benefits: benefits || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, partner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/partnerships — update partner or application
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
    const { target, id, ...updates } = body;

    if (!id || !target) {
      return NextResponse.json({ error: 'id and target (partner|application) required' }, { status: 400 });
    }

    if (target === 'partner') {
      const allowedFields = ['name', 'description', 'category', 'logo_emoji', 'logo_url', 'website_url', 'rating', 'reviews_count', 'followers_count', 'status', 'benefits'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('partners')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, partner: data });
    }

    if (target === 'application') {
      const allowedFields = ['status', 'admin_note'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('partnership_applications')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, application: data });
    }

    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/partnerships — delete partner or application
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const target = searchParams.get('target');

    if (!id || !target) {
      return NextResponse.json({ error: 'id and target query params required' }, { status: 400 });
    }

    const table = target === 'partner' ? 'partners' : 'partnership_applications';
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
