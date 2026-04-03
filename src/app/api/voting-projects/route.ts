import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/voting-projects — public: list active voting projects with stats
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: projects, error } = await (supabase as any)
      .from('voting_projects')
      .select('*')
      .in('status', ['active', 'upcoming', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

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

// POST /api/voting-projects — authenticated users vote on a project
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
    const { projectId, voteType } = body;

    if (!projectId || !['up', 'down'].includes(voteType)) {
      return NextResponse.json({ error: 'projectId and voteType (up|down) required' }, { status: 400 });
    }

    // Check project exists and is active
    const { data: project } = await (supabase as any)
      .from('voting_projects')
      .select('id, status, ends_at')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (project.status !== 'active') {
      return NextResponse.json({ error: 'Voting is not active for this project' }, { status: 400 });
    }
    if (project.ends_at && new Date(project.ends_at) < new Date()) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 400 });
    }

    // Check existing vote
    const { data: existingVote } = await (supabase as any)
      .from('voting_project_votes')
      .select('id, vote_type')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        await (supabase as any)
          .from('voting_project_votes')
          .delete()
          .eq('id', existingVote.id);
        return NextResponse.json({ success: true, action: 'removed' });
      } else {
        // Change vote
        await (supabase as any)
          .from('voting_project_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
        return NextResponse.json({ success: true, action: 'changed', voteType });
      }
    } else {
      // New vote
      const { error: insertError } = await (supabase as any)
        .from('voting_project_votes')
        .insert({
          project_id: projectId,
          user_id: user.id,
          vote_type: voteType,
        });

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, action: 'voted', voteType });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
