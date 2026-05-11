import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function isAdmin(token: string): Promise<boolean> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  const { data } = await supabaseAdmin
    .from('admin_assignments')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

// GET /api/admin/banned-words
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ') || !(await isAdmin(auth.slice(7)))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin
    .from('banned_words')
    .select('id, word, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ words: data });
}

// POST /api/admin/banned-words  body: { word }
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ') || !(await isAdmin(auth.slice(7)))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { word } = await req.json();
  const cleaned = (word || '').trim().toLowerCase();
  if (!cleaned) return NextResponse.json({ error: 'Mot requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('banned_words')
    .insert({ word: cleaned })
    .select('id, word, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word: data }, { status: 201 });
}

// DELETE /api/admin/banned-words?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ') || !(await isAdmin(auth.slice(7)))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const wordId = new URL(req.url).searchParams.get('id');
  if (!wordId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabaseAdmin.from('banned_words').delete().eq('id', wordId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
