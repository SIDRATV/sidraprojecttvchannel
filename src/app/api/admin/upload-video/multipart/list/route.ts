import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { listIncompleteMultipartUploads } from '@/lib/r2';

export async function GET(request: NextRequest) {
  try {
    // Auth check - admin only
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    // List incomplete uploads
    const uploads = await listIncompleteMultipartUploads();

    return NextResponse.json({
      success: true,
      count: uploads.length,
      uploads: uploads.map((upload) => ({
        key: upload.key,
        uploadId: upload.uploadId,
        initiatedAt: upload.initiated,
        fileSize: upload.key.split('/').pop() || 'unknown',
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('List incomplete multipart uploads error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
