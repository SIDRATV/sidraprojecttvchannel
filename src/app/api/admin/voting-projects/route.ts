import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(supabase: any, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

// GET /api/admin/voting-projects — list all voting projects with vote stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await verifyAdmin(supabase, authHeader.replace('Bearer ', ''));
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: projects, error } = await (supabase as any)
      .from('voting_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get vote stats
    const projectIds = (projects || []).map((p: any) => p.id);
    let voteStats: Record<string, { upvotes: number; downvotes: number; total: number }> = {};

    if (projectIds.length > 0) {
      const { data: votes } = await (supabase as any)
        .from('voting_project_votes')
        .select('project_id, vote_type')
        .in('project_id', projectIds);

      if (votes) {
        for (const v of votes) {
          if (!voteStats[v.project_id]) {
            voteStats[v.project_id] = { upvotes: 0, downvotes: 0, total: 0 };
          }
          voteStats[v.project_id].total++;
          if (v.vote_type === 'up') voteStats[v.project_id].upvotes++;
          else voteStats[v.project_id].downvotes++;
        }
      }
    }

    return NextResponse.json({
      projects: (projects || []).map((p: any) => ({
        ...p,
        upvotes: voteStats[p.id]?.upvotes || 0,
        downvotes: voteStats[p.id]?.downvotes || 0,
        total_votes: voteStats[p.id]?.total || 0,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/voting-projects — create a new project
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
    const { title, description, category, image_url, funding_goal, status, starts_at, ends_at } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('voting_projects')
      .insert({
        title,
        description,
        category: category || 'General',
        image_url: image_url || '',
        funding_goal: funding_goal || 0,
        funding_current: 0,
        status: status || 'active',
        starts_at: starts_at || new Date().toISOString(),
        ends_at: ends_at || null,
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/voting-projects — update a project
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
    const { projectId, ...updates } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const allowedFields = ['title', 'description', 'category', 'image_url', 'funding_goal', 'funding_current', 'status', 'starts_at', 'ends_at'];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from('voting_projects')
      .update(safeUpdates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/voting-projects — delete a project
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
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('voting_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
