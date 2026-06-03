import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { listIncompleteMultipartUploads } from '@/lib/r2';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check — admin only
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyJwt(token);
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', verified.sub)
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
