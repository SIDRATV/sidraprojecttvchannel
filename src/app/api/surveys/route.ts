import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/surveys — get available surveys for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // @ts-ignore - RPC function not in generated types
    const { data, error } = await (supabase as any).rpc('get_available_surveys', { p_user_id: user.id });
    if (error) throw error;

    return NextResponse.json({ surveys: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/surveys — submit survey response
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { surveyId, answers } = body;

    if (!surveyId || !answers) {
      return NextResponse.json({ error: 'Missing surveyId or answers' }, { status: 400 });
    }

    // Check if already responded
    const { data: existing } = await (supabase as any)
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Vous avez déjà répondu à ce sondage' }, { status: 400 });
    }

    // Insert response
    const { error: insertError } = await (supabase as any)
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        user_id: user.id,
        answers,
        rewarded: false,
      });

    if (insertError) throw insertError;

    // Create notification
    const { data: survey } = await (supabase as any)
      .from('surveys')
      .select('title, reward_amount, reward_currency')
      .eq('id', surveyId)
      .single();

    if (survey) {
      // @ts-ignore - RPC function not in generated types
      await (supabase as any).rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'system',
        p_title: 'Sondage complété',
        p_message: `Merci d'avoir répondu à "${survey.title}". Récompense: ${survey.reward_amount} ${survey.reward_currency}`,
        p_icon: 'gift',
        p_link: '/premium-dashboard',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
