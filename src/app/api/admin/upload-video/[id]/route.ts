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
