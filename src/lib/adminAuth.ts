import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role: AdminRole | null;
}

export interface AdminRole {
  id: string;
  name: string;
  type: 'super_admin' | 'full_access' | 'partial_access' | 'read_only';
  permissions: {
    users: boolean;
    videos: boolean;
    categories: boolean;
    finances: boolean;
    security: boolean;
    admins: boolean;
  };
}

export type AdminPermission = keyof AdminRole['permissions'];

/**
 * Validate request with admin secret key (for server-to-server or bypass).
 */
function hasSecretKey(request: NextRequest): boolean {
  const header = request.headers.get('x-admin-secret');
  const query = new URL(request.url).searchParams.get('admin_key');
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) return false;
  return header === secret || query === secret;
}

/**
 * Authenticate and authorize an admin request.
 * Returns { admin, supabase } on success, or sends 401/403 response.
 *
 * @param permission  Optional: specific permission required (e.g. 'finances')
 *                    If omitted, any admin (is_admin=true) is allowed.
 */
export async function requireAdmin(
  request: NextRequest,
  permission?: AdminPermission,
): Promise<
  | { ok: true; admin: AdminUser; supabase: ReturnType<typeof createServerClient> }
  | { ok: false; response: NextResponse }
> {
  // Allow bypass via secret key (super admin level)
  const supabase = createServerClient();

  if (hasSecretKey(request)) {
    // Treat as super admin with all permissions
    const fakeAdmin: AdminUser = {
      id: 'system',
      email: 'system@sidratv.internal',
      full_name: 'System Admin',
      is_admin: true,
      role: {
        id: 'system',
        name: 'Super Admin',
        type: 'super_admin',
        permissions: {
          users: true,
          videos: true,
          categories: true,
          finances: true,
          security: true,
          admins: true,
        },
      },
    };
    return { ok: true, admin: fakeAdmin, supabase };
  }

  // Bearer token auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    // Log intrusion attempt
    try {
      await supabase.from('security_events' as any).insert([{
        type: 'admin_access_unauthorized',
        severity: 'high',
        title: 'Tentative d\'accès admin non autorisée',
        description: `Utilisateur ${user.email} a tenté d'accéder à une page admin`,
        user_id: user.id,
        metadata: { email: user.email, path: request.nextUrl.pathname },
      }]);
    } catch {}

    return { ok: false, response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  // Fetch role assignment
  const { data: assignment } = await (supabase as any)
    .from('admin_assignments')
    .select('role_id, admin_roles(id, name, type, permissions)')
    .eq('user_id', user.id)
    .single();

  const role: AdminRole | null = assignment?.admin_roles
    ? {
        id: assignment.admin_roles.id,
        name: assignment.admin_roles.name,
        type: assignment.admin_roles.type,
        permissions: assignment.admin_roles.permissions,
      }
    : null;

  // If they are is_admin but no role, treat as super_admin
  const effectivePermissions = role?.permissions ?? {
    users: true,
    videos: true,
    categories: true,
    finances: true,
    security: true,
    admins: true,
  };

  // Check specific permission
  if (permission && !effectivePermissions[permission]) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Permission insuffisante. Accès '${permission}' requis.` },
        { status: 403 },
      ),
    };
  }

  const admin: AdminUser = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    is_admin: true,
    role: role ?? {
      id: 'default',
      name: 'Super Admin',
      type: 'super_admin',
      permissions: effectivePermissions,
    },
  };

  return { ok: true, admin, supabase };
}
