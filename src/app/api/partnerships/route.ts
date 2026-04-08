import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/partnerships — public: list active/featured partners
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: partners, error } = await (supabase as any)
      .from('partners')
      .select('*')
      .in('status', ['active', 'featured'])
      .order('status', { ascending: true }) // featured first
      .order('rating', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ partners: partners || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/partnerships — authenticated user submits a partnership application with payment
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
      project_name, owner_name, owner_email, partnership_type,
      domain, redirect_link, benefits, countries,
      sda_amount, has_team_in_5_countries, has_sda_2000_plus,
      duration_type, payment_currency,
    } = body;

    if (!project_name || !owner_name || !owner_email || !partnership_type) {
      return NextResponse.json({ error: 'project_name, owner_name, owner_email, and partnership_type are required' }, { status: 400 });
    }

    if (!['advertising', 'project'].includes(partnership_type)) {
      return NextResponse.json({ error: 'partnership_type must be advertising or project' }, { status: 400 });
    }

    if (!duration_type || !['weekly', 'monthly', 'yearly'].includes(duration_type)) {
      return NextResponse.json({ error: 'duration_type (weekly, monthly, yearly) is required' }, { status: 400 });
    }

    if (!payment_currency || !['sidra', 'sptc', 'visa'].includes(payment_currency)) {
      return NextResponse.json({ error: 'payment_currency (sidra, sptc, visa) is required' }, { status: 400 });
    }

    // 1. Look up pricing
    const { data: pricing, error: pricingErr } = await (supabase as any)
      .from('partnership_pricing')
      .select('*')
      .eq('partnership_type', partnership_type)
      .eq('duration_type', duration_type)
      .eq('is_active', true)
      .single();

    if (pricingErr || !pricing) {
      return NextResponse.json({ error: 'Aucun tarif trouvé pour cette combinaison' }, { status: 400 });
    }

    // Determine amount based on currency
    let paymentAmount = 0;
    if (payment_currency === 'sidra') paymentAmount = Number(pricing.price_sidra);
    else if (payment_currency === 'sptc') paymentAmount = Number(pricing.price_sptc);
    else if (payment_currency === 'visa') paymentAmount = Number(pricing.price_usd);

    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    // 2. For Sidra/SPTC: verify user has sufficient balance (wallet check)
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

      // Deduct from wallet
      const { error: deductErr } = await (supabase as any)
        .from('wallet_accounts')
        .update({ balance: userBalance - paymentAmount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (deductErr) throw deductErr;

      // Log wallet transaction
      await (supabase as any)
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'partnership_payment',
          amount: -paymentAmount,
          currency: payment_currency,
          status: 'completed',
          description: `Paiement partenariat ${partnership_type} (${duration_type})`,
        });
    }

    // 3. Create payment record
    const { data: payment, error: payErr } = await (supabase as any)
      .from('partnership_payments')
      .insert({
        user_id: user.id,
        pricing_id: pricing.id,
        amount: paymentAmount,
        currency: payment_currency,
        duration_type,
        status: payment_currency === 'visa' ? 'pending' : 'completed',
        transaction_ref: `PAR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // 4. Create application with payment info
    const { data, error } = await (supabase as any)
      .from('partnership_applications')
      .insert({
        user_id: user.id,
        project_name,
        owner_name,
        owner_email,
        partnership_type,
        domain: domain || '',
        redirect_link: redirect_link || '',
        benefits: benefits || [],
        countries: countries || [],
        sda_amount: sda_amount || 0,
        has_team_in_5_countries: has_team_in_5_countries || false,
        has_sda_2000_plus: has_sda_2000_plus || false,
        status: 'pending',
        payment_status: payment_currency === 'visa' ? 'unpaid' : 'paid',
        payment_id: payment.id,
        duration_type,
        payment_currency,
        payment_amount: paymentAmount,
      })
      .select()
      .single();

    if (error) throw error;

    // Update payment with application_id
    await (supabase as any)
      .from('partnership_payments')
      .update({ application_id: data.id })
      .eq('id', payment.id);

    return NextResponse.json({ success: true, application: data, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
