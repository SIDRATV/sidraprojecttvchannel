import { createServerClient } from './supabase';

export async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function getInternalTransactions(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('network', 'internal')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Failed to fetch transactions');
  }

  return data || [];
}
