import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/partnerships/pricing — public: get active pricing for all types
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: pricing, error } = await (supabase as any)
      .from('partnership_pricing')
      .select('*')
      .eq('is_active', true)
      .order('partnership_type')
      .order('duration_type');

    if (error) throw error;

    return NextResponse.json({ pricing: pricing || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
