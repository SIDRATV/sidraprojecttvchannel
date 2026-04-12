import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/advertisements — public: list active advertisements
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: advertisements, error } = await (supabase as any)
      .from('advertisements')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ advertisements: advertisements || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/advertisements — authenticated user creates an ad with payment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const {
      advertiser_name, email, whatsapp, ad_type,
      media_url, media_type, redirect_url,
      duration_days, payment_currency,
    } = body;

    if (!advertiser_name || !email || !ad_type || !media_url) {
      return NextResponse.json({ error: 'advertiser_name, email, ad_type, and media_url are required' }, { status: 400 });
    }

    if (!['banner', 'popup', 'video', 'other'].includes(ad_type)) {
      return NextResponse.json({ error: 'ad_type must be banner, popup, video, or other' }, { status: 400 });
    }

    if (!duration_days || ![1, 7, 30].includes(duration_days)) {
      return NextResponse.json({ error: 'duration_days must be 1, 7, or 30' }, { status: 400 });
    }

    if (!payment_currency || !['sidra', 'sptc', 'visa'].includes(payment_currency)) {
      return NextResponse.json({ error: 'payment_currency (sidra, sptc, visa) is required' }, { status: 400 });
    }

    // 1. Look up pricing
    const { data: pricing, error: pricingErr } = await (supabase as any)
      .from('ad_pricing')
      .select('*')
      .eq('ad_type', ad_type)
      .eq('duration_days', duration_days)
      .eq('is_active', true)
      .single();

    if (pricingErr || !pricing) {
      return NextResponse.json({ error: 'Aucun tarif trouvé pour cette combinaison' }, { status: 400 });
    }

    let paymentAmount = 0;
    if (payment_currency === 'sidra') paymentAmount = Number(pricing.price_sidra);
    else if (payment_currency === 'sptc') paymentAmount = Number(pricing.price_sptc);
    else if (payment_currency === 'visa') paymentAmount = Number(pricing.price_usd);

    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    // 2. Verify balance & deduct
    if (payment_currency === 'sidra' || payment_currency === 'sptc') {
      const { data: wallet } = await (supabase as any)
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const userBalance = wallet ? Number(wallet.balance) : 0;
      if (userBalance < paymentAmount) {
        return NextResponse.json({ error: `Solde insuffisant. Requis: ${paymentAmount} ${payment_currency.toUpperCase()}, Disponible: ${userBalance}` }, { status: 400 });
      }

      const { error: deductErr } = await (supabase as any)
        .from('wallet_accounts')
        .update({ balance: userBalance - paymentAmount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (deductErr) throw deductErr;

      await (supabase as any)
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'ad_payment',
          amount: -paymentAmount,
          currency: payment_currency,
          status: 'completed',
          description: `Paiement publicité ${ad_type} (${duration_days} jours)`,
        });
    }

    // 3. Create advertisement
    const transactionRef = `AD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await (supabase as any)
      .from('advertisements')
      .insert({
        user_id: user.id,
        advertiser_name,
        email,
        whatsapp: whatsapp || '',
        ad_type,
        media_url,
        media_type: media_type || 'image',
        redirect_url: redirect_url || '',
        duration_days,
        budget: paymentAmount,
        currency: payment_currency,
        status: 'pending_review',
        payment_status: payment_currency === 'visa' ? 'pending' : 'completed',
        payment_ref: transactionRef,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, advertisement: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
