import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/wallet';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const supabase = createServerClient();

    // Fetch pending deposits for this user
    const { data: pendingDeposits, error } = await supabase
      .from('wallet_transactions')
      .select('id, amount, tx_hash, network, deposit_address, from_address, metadata, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch pending deposits' }, { status: 500 });
    }

    // Also fetch recently confirmed deposits (last 10 minutes) to show animation
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentConfirmed } = await supabase
      .from('wallet_transactions')
      .select('id, amount, tx_hash, network, deposit_address, metadata, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .eq('status', 'success')
      .gte('updated_at', tenMinutesAgo)
      .order('updated_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      pending: pendingDeposits || [],
      recentlyConfirmed: recentConfirmed || [],
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch pending deposits';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
