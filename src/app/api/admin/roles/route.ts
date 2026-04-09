import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// GET — list all admin roles
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;

  const { data: roles, error } = await (supabase as any)
    .from('admin_roles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch formal role assignments
  const { data: assignments } = await (supabase as any)
    .from('admin_assignments')
    .select('user_id, role_id, notes, assigned_at, users(id, email, full_name, username)');

  // Also include users with is_admin=true who have no formal assignment
  const { data: adminUsers } = await (supabase as any)
    .from('users')
    .select('id, email, full_name, username')
    .eq('is_admin', true);

  const assignedUserIds = new Set((assignments ?? []).map((a: any) => a.user_id));
  const virtualAssignments = (adminUsers ?? [])
    .filter((u: any) => !assignedUserIds.has(u.id))
    .map((u: any) => ({
      user_id: u.id,
      role_id: null,
      notes: null,
      assigned_at: null,
      users: { id: u.id, email: u.email, full_name: u.full_name, username: u.username },
    }));

  return NextResponse.json({
    roles: roles ?? [],
    assignments: [...(assignments ?? []), ...virtualAssignments],
  });
}

// POST — create a new role
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const body = await request.json();

  const { name, type, permissions, description } = body;
  if (!name || !type || !permissions) {
    return NextResponse.json({ error: 'name, type, permissions required' }, { status: 400 });
  }

  const validTypes = ['super_admin', 'full_access', 'partial_access', 'read_only'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid role type' }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from('admin_roles')
    .insert([{ name, type, permissions, description: description ?? null }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ role: data }, { status: 201 });
}

// PATCH — update a role
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const body = await request.json();

  const { id, name, type, permissions, description } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (permissions !== undefined) updates.permissions = permissions;
  if (description !== undefined) updates.description = description;

  const { data, error } = await (supabase as any)
    .from('admin_roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: data });
}

// DELETE — delete a role
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // First remove assignments for this role
  await (supabase as any).from('admin_assignments').delete().eq('role_id', id);

  const { error } = await (supabase as any).from('admin_roles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
