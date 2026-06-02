import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { abortMultipartUpload } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has admin role or matches admin email)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
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
