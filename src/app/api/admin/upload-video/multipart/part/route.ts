import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { getPresignedPartUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    // Auth — admin only
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = extractBearerToken(authHeader);
    const jwtPayload = token ? await verifyJwt(token) : null;
    if (!jwtPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', jwtPayload.sub)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { key, uploadId, partNumber, contentLength } = body;

    if (!key || !uploadId || !partNumber || !contentLength) {
      return NextResponse.json(
        { error: 'Missing required fields: key, uploadId, partNumber, contentLength' },
        { status: 400 },
      );
    }

    // Calculate presigned URL expiry based on part size (1 hour minimum)
    const expiresIn = Math.max(3600, Math.ceil((contentLength / (1024 * 1024)) * 60));

    const presignedUrl = await getPresignedPartUploadUrl(key, uploadId, partNumber, contentLength, expiresIn);

    return NextResponse.json({
      presignedUrl,
      expiresIn,
    });
  } catch (err) {
    console.error('get part url error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to generate presigned part URL: ${message}` },
      { status: 500 },
    );
  }
}
