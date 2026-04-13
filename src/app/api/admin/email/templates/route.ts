import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// GET — List all templates
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from('email_templates')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create new template
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { slug, name, subject, html_body, description, variables } = body;

  if (!slug || !name || !subject || !html_body) {
    return NextResponse.json({ error: 'slug, name, subject, and html_body are required' }, { status: 400 });
  }

  // Validate slug format
  if (!/^[a-z0-9_]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug must contain only lowercase letters, numbers, and underscores' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('email_templates')
    .insert({
      slug,
      name,
      subject,
      html_body,
      description: description || null,
      variables: variables || [],
      is_system: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un template avec ce slug existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update template
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { id, name, subject, html_body, description, variables, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (subject !== undefined) updates.subject = subject;
  if (html_body !== undefined) updates.html_body = html_body;
  if (description !== undefined) updates.description = description;
  if (variables !== undefined) updates.variables = variables;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await auth.supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete non-system template
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  // Check it's not a system template
  const { data: template } = await auth.supabase
    .from('email_templates')
    .select('is_system')
    .eq('id', id)
    .single();

  if (template?.is_system) {
    return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
  }

  const { error } = await auth.supabase
    .from('email_templates')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
