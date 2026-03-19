import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { AuthenticatedWalletUser } from './types';
import { walletConfig } from './config';

export const getBearerToken = (request: NextRequest): string => {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization token');
  }

  return authHeader.slice(7);
};

export const requireAdminApiKeyOrUser = async (
  request: NextRequest
): Promise<AuthenticatedWalletUser | null> => {
  const adminApiKey = request.headers.get('x-admin-api-key');

  if (walletConfig.adminApiKey && adminApiKey === walletConfig.adminApiKey) {
    return null;
  }

  return requireAuthenticatedUser(request, { mustBeAdmin: true });
};

export const requireAuthenticatedUser = async (
  request: NextRequest,
  options?: { mustBeAdmin?: boolean }
): Promise<AuthenticatedWalletUser> => {
  const token = getBearerToken(request);
  const supabase = createServerClient();

  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    throw new Error('Unauthorized');
  }

  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, username, full_name, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  if (options?.mustBeAdmin && !profile.is_admin) {
    throw new Error('Admin access required');
  }

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    fullName: profile.full_name,
    isAdmin: profile.is_admin,
  };
};

export const requireOptional2FA = (request: NextRequest): void => {
  if (!walletConfig.require2FA) {
    return;
  }

  if (!walletConfig.master2FACode) {
    throw new Error('2FA is required but WALLET_2FA_MASTER_CODE is not configured');
  }

  const code = request.headers.get('x-wallet-2fa');

  if (!code || code !== walletConfig.master2FACode) {
    throw new Error('Invalid 2FA code');
  }
};
