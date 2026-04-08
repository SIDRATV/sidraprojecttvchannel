import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/partnerships — list all partners + applications
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
    const type = searchParams.get('type') || 'all'; // 'partners', 'applications', 'all'

    let partners = null;
    let applications = null;
    let pricing = null;
    let banners = null;

    if (type === 'partners' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      partners = data;
    }

    if (type === 'applications' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('partnership_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      applications = data;
    }

    if (type === 'pricing' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('partnership_pricing')
        .select('*')
        .order('partnership_type')
        .order('duration_type');
      if (error) throw error;
      pricing = data;
    }

    if (type === 'banners' || type === 'all') {
      const { data, error } = await (supabase as any)
        .from('sponsored_banners')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      banners = data;
    }

    return NextResponse.json({ partners, applications, pricing, banners });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/partnerships — create a new partner or banner
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { target } = body;

    if (target === 'banner') {
      const { title, description, image_url, video_url, media_type, autoplay, display_duration, link_url, banner_type, starts_at, ends_at, partner_id, application_id, priority } = body;
      if ((!image_url && media_type !== 'video') || !ends_at) {
        return NextResponse.json({ error: 'image_url (or video_url for video type) and ends_at are required' }, { status: 400 });
      }

      const { data, error } = await (supabase as any)
        .from('sponsored_banners')
        .insert({
          title: title || '',
          description: description || '',
          image_url: image_url || '',
          video_url: video_url || '',
          media_type: media_type || 'image',
          autoplay: autoplay ?? false,
          display_duration: display_duration || 10,
          link_url: link_url || '',
          banner_type: banner_type || 'large',
          starts_at: starts_at || new Date().toISOString(),
          ends_at,
          partner_id: partner_id || null,
          application_id: application_id || null,
          is_active: true,
          priority: priority || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, banner: data });
    }

    // Default: create partner
    const { name, description, category, logo_emoji, logo_url, website_url, status, benefits } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('partners')
      .insert({
        name,
        description: description || '',
        category: category || 'Technologie',
        logo_emoji: logo_emoji || '🤝',
        logo_url: logo_url || '',
        website_url: website_url || '',
        status: status || 'active',
        benefits: benefits || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, partner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/partnerships — update partner or application
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
      return NextResponse.json({ error: 'id and target (partner|application) required' }, { status: 400 });
    }

    if (target === 'partner') {
      const allowedFields = ['name', 'description', 'category', 'logo_emoji', 'logo_url', 'website_url', 'rating', 'reviews_count', 'followers_count', 'status', 'benefits'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('partners')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, partner: data });
    }

    if (target === 'application') {
      const allowedFields = ['status', 'admin_note', 'correction_note'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      // If rejecting, process refund
      if (updates.status === 'rejected') {
        const { data: app } = await (supabase as any)
          .from('partnership_applications')
          .select('user_id, payment_id, payment_amount, payment_currency, payment_status')
          .eq('id', id)
          .single();

        if (app && app.payment_status === 'paid' && app.payment_amount > 0 && (app.payment_currency === 'sidra' || app.payment_currency === 'sptc')) {
          // Refund to wallet
          const { data: wallet } = await (supabase as any)
            .from('wallet_accounts')
            .select('balance')
            .eq('user_id', app.user_id)
            .single();

          if (wallet) {
            await (supabase as any)
              .from('wallet_accounts')
              .update({ balance: Number(wallet.balance) + Number(app.payment_amount), updated_at: new Date().toISOString() })
              .eq('user_id', app.user_id);

            await (supabase as any)
              .from('wallet_transactions')
              .insert({
                user_id: app.user_id,
                type: 'partnership_refund',
                amount: Number(app.payment_amount),
                currency: app.payment_currency,
                status: 'completed',
                description: `Remboursement partenariat rejeté`,
              });
          }

          // Update payment record
          if (app.payment_id) {
            await (supabase as any)
              .from('partnership_payments')
              .update({ status: 'refunded', refund_reason: updates.admin_note || 'Candidature rejetée', updated_at: new Date().toISOString() })
              .eq('id', app.payment_id);
          }

          safeUpdates.payment_status = 'refunded';
        }
      }

      const { data, error } = await (supabase as any)
        .from('partnership_applications')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, application: data });
    }

    if (target === 'pricing') {
      const allowedFields = ['price_sidra', 'price_sptc', 'price_usd', 'is_active'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('partnership_pricing')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, pricing: data });
    }

    if (target === 'banner') {
      const allowedFields = ['title', 'description', 'image_url', 'video_url', 'media_type', 'autoplay', 'display_duration', 'link_url', 'banner_type', 'starts_at', 'ends_at', 'is_active', 'priority', 'partner_id', 'application_id'];
      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('sponsored_banners')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, banner: data });
    }

    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/partnerships — delete partner or application
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
    const target = searchParams.get('target');

    if (!id || !target) {
      return NextResponse.json({ error: 'id and target query params required' }, { status: 400 });
    }

    const table = target === 'partner' ? 'partners' : target === 'banner' ? 'sponsored_banners' : 'partnership_applications';
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
