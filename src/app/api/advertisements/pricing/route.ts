import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/advertisements/pricing — public: list active ad pricing
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: pricing, error } = await (supabase as any)
      .from('ad_pricing')
      .select('*')
      .eq('is_active', true)
      .order('ad_type')
      .order('duration_days');

    if (error) throw error;

    return NextResponse.json({ pricing: pricing || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
