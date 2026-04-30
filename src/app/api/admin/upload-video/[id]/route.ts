import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get video to find R2 keys
    const { data: video, error: fetchError } = await (supabase as any)
      .from('premium_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Delete files from R2
    const deletePromises: Promise<void>[] = [];
    if (video.thumbnail_key) deletePromises.push(deleteFromR2(video.thumbnail_key));
    if (video.video_key_480p) deletePromises.push(deleteFromR2(video.video_key_480p));
    if (video.video_key_720p) deletePromises.push(deleteFromR2(video.video_key_720p));
    if (video.video_key_1080p) deletePromises.push(deleteFromR2(video.video_key_1080p));

    await Promise.allSettled(deletePromises);

    // Delete from database
    const { error: deleteError } = await (supabase as any)
      .from('premium_videos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete premium video error:', err);
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/upload-video/[id] — update metadata (title, description, category, plan, sort_order)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();

    // Only allow safe fields to be updated
    const ALLOWED = ['title', 'description', 'category_id', 'min_plan', 'sort_order'] as const;
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) update[key] = body[key] === '' ? null : body[key];
    }

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    if (update.min_plan !== undefined && !['pro', 'premium', 'vip'].includes(update.min_plan as string))
      return NextResponse.json({ error: 'Invalid min_plan' }, { status: 400 });

    const { data, error: updateError } = await (supabase as any)
      .from('premium_videos')
      .update(update)
      .eq('id', id)
      .select('id, title, description, category_id, min_plan, sort_order')
      .single();

    if (updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true, video: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
