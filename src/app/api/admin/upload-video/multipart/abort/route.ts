import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { abortMultipartUpload } from '@/lib/r2';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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
