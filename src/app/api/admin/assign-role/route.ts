import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * POST /api/admin/assign-role
 * Body: { user_email?: string, user_id?: string, role_id: string, notes?: string }
 *
 * DELETE /api/admin/assign-role
 * Body: { user_id: string }  — removes the admin assignment and revokes is_admin
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { admin, supabase } = auth;
  const body = await request.json();
  const { user_email, user_id: bodyUserId, role_id, notes } = body;

  if (!role_id) {
    return NextResponse.json({ error: 'role_id is required' }, { status: 400 });
  }

  // Resolve user ID from email or direct ID
  let targetUserId: string | undefined = bodyUserId;

  if (!targetUserId && user_email) {
    const { data: found } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email.trim().toLowerCase())
      .single();

    if (!found) {
      return NextResponse.json({ error: 'Utilisateur non trouvé avec cet email' }, { status: 404 });
    }
    targetUserId = found.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'user_email ou user_id requis' }, { status: 400 });
  }

  // Verify role exists
  const { data: role } = await (supabase as any)
    .from('admin_roles')
    .select('id, name')
    .eq('id', role_id)
    .single();

  if (!role) {
    return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 });
  }

  // Upsert assignment
  const { error: assignError } = await (supabase as any)
    .from('admin_assignments')
    .upsert(
      [{
        user_id: targetUserId,
        role_id,
        assigned_by: admin.id,
        notes: notes ?? null,
      }],
      { onConflict: 'user_id' },
    );

  if (assignError) {
    return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  // Set is_admin = true for the target user
  await supabase.from('users').update({ is_admin: true }).eq('id', targetUserId);

  // Log the action
  await (supabase as any).from('admin_user_actions').insert([{
    admin_id: admin.id,
    target_user_id: targetUserId,
    action: 'assign_admin_role',
    reason: `Assigné au rôle: ${role.name}`,
    metadata: { role_id, role_name: role.name },
  }]);

  return NextResponse.json({ success: true, message: `Rôle "${role.name}" assigné avec succès` });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'admins');
  if (!auth.ok) return auth.response;

  const { admin, supabase } = auth;
  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
  }

  // Remove the assignment
  await (supabase as any).from('admin_assignments').delete().eq('user_id', user_id);

  // Revoke is_admin
  await supabase.from('users').update({ is_admin: false }).eq('id', user_id);

  // Log action
  await (supabase as any).from('admin_user_actions').insert([{
    admin_id: admin.id,
    target_user_id: user_id,
    action: 'revoke_admin_role',
    reason: 'Révocation des droits admin',
  }]);

  return NextResponse.json({ success: true });
}
