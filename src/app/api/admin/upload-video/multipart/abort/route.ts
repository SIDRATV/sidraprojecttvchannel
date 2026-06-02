import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { abortMultipartUpload } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase.from('users').select('is_admin').eq('id', user.id).single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { key, uploadId } = body;

    if (!key || !uploadId) {
      return NextResponse.json({ error: 'Missing key or uploadId' }, { status: 400 });
    }

    // Abort the multipart upload on R2
    await abortMultipartUpload(key, uploadId);

    return NextResponse.json({ success: true, message: `Aborted multipart upload for ${key}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Abort multipart upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
