import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/advertisements — list all ads + pricing
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
    const type = searchParams.get('type') || 'all';

    let advertisements = null;
    let pricing = null;

    if (type === 'advertisements' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      advertisements = data;
    }

    if (type === 'pricing' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('ad_pricing')
        .select('*')
        .order('ad_type')
        .order('duration_days');
      if (error) throw error;
      pricing = data;
    }

    return NextResponse.json({ advertisements, pricing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/advertisements — update ad or pricing
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
      return NextResponse.json({ error: 'id and target required' }, { status: 400 });
    }

    if (target === 'advertisement') {
      const allowedFields = ['status', 'reject_reason', 'admin_note', 'starts_at', 'ends_at'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      // If activating, set start/end dates
      if (updates.status === 'active') {
        const { data: ad } = await (supabase as any)
          .from('advertisements')
          .select('duration_days')
          .eq('id', id)
          .single();

        if (ad) {
          const now = new Date();
          safeUpdates.starts_at = now.toISOString();
          const endDate = new Date(now.getTime() + (ad.duration_days * 24 * 60 * 60 * 1000));
          safeUpdates.ends_at = endDate.toISOString();
        }
      }

      // If rejecting, process refund
      if (updates.status === 'rejected') {
        const { data: ad } = await (supabase as any)
          .from('advertisements')
          .select('user_id, budget, currency, payment_status')
          .eq('id', id)
          .single();

        if (ad && ad.payment_status === 'completed' && ad.budget > 0 && (ad.currency === 'sidra' || ad.currency === 'sptc')) {
          const { data: wallet } = await (supabase as any)
            .from('wallet_accounts')
            .select('balance')
            .eq('user_id', ad.user_id)
            .single();

          if (wallet) {
            await (supabase as any)
              .from('wallet_accounts')
              .update({ balance: Number(wallet.balance) + Number(ad.budget), updated_at: new Date().toISOString() })
              .eq('user_id', ad.user_id);

            await (supabase as any)
              .from('wallet_transactions')
              .insert({
                user_id: ad.user_id,
                type: 'ad_refund',
                amount: Number(ad.budget),
                currency: ad.currency,
                status: 'completed',
                description: `Remboursement publicité rejetée`,
              });
          }

          safeUpdates.payment_status = 'refunded';
        }
      }

      const { data, error } = await (supabase as any)
        .from('advertisements')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, advertisement: data });
    }

    if (target === 'pricing') {
      const allowedFields = ['price_sidra', 'price_sptc', 'price_usd', 'is_active'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('ad_pricing')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, pricing: data });
    }

    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/advertisements — delete an ad
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

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await (supabase as any).from('advertisements').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
