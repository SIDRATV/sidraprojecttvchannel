import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Helper: verify admin
async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/surveys — list all surveys with response counts
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: surveys, error } = await (supabase as any)
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get response counts
    const surveyIds = (surveys || []).map((s: any) => s.id);
    let responseCounts: Record<string, number> = {};

    if (surveyIds.length > 0) {
      const { data: counts } = await (supabase as any)
        .from('survey_responses')
        .select('survey_id')
        .in('survey_id', surveyIds);

      if (counts) {
        for (const c of counts) {
          responseCounts[c.survey_id] = (responseCounts[c.survey_id] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      surveys: (surveys || []).map((s: any) => ({
        ...s,
        response_count: responseCounts[s.id] || 0,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/surveys — create a new survey
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
    const { title, description, questions, reward_amount, duration_minutes, min_plan, max_responses, expires_at } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('surveys')
      .insert({
        title,
        description: description || '',
        questions,
        reward_amount: reward_amount || 0,
        reward_currency: 'SPTC',
        duration_minutes: duration_minutes || 5,
        min_plan: min_plan || 'pro',
        max_responses: max_responses || null,
        expires_at: expires_at || null,
        created_by: admin.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast notification to eligible users
    // @ts-ignore - RPC function not in generated types
    await (supabase as any).rpc('broadcast_notification', {
      p_type: 'system',
      p_title: 'Nouveau sondage disponible',
      p_message: `"${title}" — Récompense: ${reward_amount || 0} SPTC`,
      p_icon: 'gift',
      p_link: '/premium-dashboard',
    });

    return NextResponse.json({ success: true, survey: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/surveys — toggle survey active/inactive
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
    const { surveyId, is_active } = body;

    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId required' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('surveys')
      .update({ is_active })
      .eq('id', surveyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/surveys — delete a survey
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const surveyId = url.searchParams.get('id');
    if (!surveyId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
