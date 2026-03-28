import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * POST /api/admin/user-actions
 * Body: { user_id, action, reason? }
 * Actions: 'block' | 'unblock' | 'warn' | 'delete' | 'make_premium' | 'revoke_premium'
 *
 * GET /api/admin/user-actions
 * Returns audit log of admin actions
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (!auth.ok) return auth.response;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const userId = searchParams.get('user_id');

  let query = (supabase as any)
    .from('admin_user_actions')
    .select('*, admin:admin_id(email, full_name), target:target_user_id(email, full_name, username)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('target_user_id', userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ actions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (!auth.ok) return auth.response;

  const { admin, supabase } = auth;

  let body: { user_id?: string; action?: string; reason?: string; plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { user_id, action, reason } = body;

  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id et action sont requis' }, { status: 400 });
  }

  const validActions = ['block', 'unblock', 'warn', 'delete', 'make_premium', 'revoke_premium', 'restore'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Action invalide. Actions valides: ${validActions.join(', ')}` }, { status: 400 });
  }

  // Prevent self-action
  if (user_id === admin.id) {
    return NextResponse.json({ error: 'Impossible d\'effectuer cette action sur son propre compte' }, { status: 400 });
  }

  // Fetch the target user
  const { data: targetUser } = await (supabase as any)
    .from('users')
    .select('id, email, is_admin, is_blocked, warning_count, deleted_at')
    .eq('id', user_id)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  // Prevent action against another admin (unless super admin)
  if (
    targetUser.is_admin &&
    admin.role?.type !== 'super_admin' &&
    admin.id !== 'system'
  ) {
    return NextResponse.json({ error: 'Impossible d\'agir sur un autre administrateur' }, { status: 403 });
  }

  let updateData: Record<string, unknown> = {};
  let logAction = action;
  let logReason = reason ?? '';

  switch (action) {
    case 'block':
      updateData = {
        is_blocked: true,
        block_reason: reason ?? 'Violation des conditions d\'utilisation',
        blocked_at: new Date().toISOString(),
      };
      logReason = reason ?? 'Blocage du compte';
      break;

    case 'unblock':
      updateData = {
        is_blocked: false,
        block_reason: null,
        blocked_at: null,
      };
      logReason = reason ?? 'Déblocage du compte';
      break;

    case 'warn':
      updateData = {
        warning_count: ((targetUser as any).warning_count ?? 0) + 1,
        last_warning_at: new Date().toISOString(),
        last_warning_reason: reason ?? 'Avertissement officiel',
      };
      logReason = reason ?? 'Avertissement émis';
      break;

    case 'delete':
      // Soft delete
      updateData = {
        deleted_at: new Date().toISOString(),
        is_blocked: true,
        block_reason: 'Compte supprimé',
      };
      logReason = reason ?? 'Suppression du compte';
      break;

    case 'restore':
      // Undo soft delete
      updateData = {
        deleted_at: null,
        is_blocked: false,
        block_reason: null,
      };
      logReason = reason ?? 'Restauration du compte';
      break;

    case 'make_premium':
      updateData = {
        premium_plan: body.plan ?? 'pro',
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      logReason = `Plan premium assigné: ${body.plan ?? 'pro'}`;
      break;

    case 'revoke_premium':
      updateData = {
        premium_plan: null,
        premium_expires_at: null,
      };
      logReason = reason ?? 'Plan premium révoqué';
      break;
  }

  // Apply update
  const { error: updateError } = await supabase
    .from('users')
    .update(updateData as any)
    .eq('id', user_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the action
  try {
    await (supabase as any).from('admin_user_actions').insert([{
      admin_id: admin.id,
      target_user_id: user_id,
      action: logAction,
      reason: logReason,
      metadata: { target_email: targetUser.email },
    }]);
  } catch {}

  // Log as security event for severe actions
  if (action === 'delete' || action === 'block') {
    try {
      await (supabase as any).from('security_events').insert([{
        type: 'account_takeover_attempt',
        severity: action === 'delete' ? 'high' : 'medium',
        title: action === 'delete' ? 'Compte supprimé par admin' : 'Compte bloqué par admin',
        description: `Admin ${admin.email} a ${action === 'delete' ? 'supprimé' : 'bloqué'} le compte de ${targetUser.email}. Raison: ${logReason}`,
        user_id,
        metadata: { admin_id: admin.id, admin_email: admin.email, reason: logReason },
      }]);
    } catch {}
  }

  return NextResponse.json({ success: true, action, user_id });
}
