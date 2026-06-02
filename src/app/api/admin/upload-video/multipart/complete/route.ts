import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { completeMultipartUpload } from '@/lib/r2';

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
    const { key, uploadId, parts } = body;

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'Missing required fields: key, uploadId, parts (array)' },
        { status: 400 },
      );
    }

    if (parts.length === 0) {
      return NextResponse.json({ error: 'parts array cannot be empty' }, { status: 400 });
    }

    // Validate parts format
    for (const part of parts) {
      if (!part.PartNumber || !part.ETag) {
        return NextResponse.json(
          { error: 'Each part must have PartNumber and ETag' },
          { status: 400 },
        );
      }
    }

    // Complete multipart upload
    await completeMultipartUpload(key, uploadId, parts);

    return NextResponse.json({
      success: true,
      key,
      partsCount: parts.length,
    });
  } catch (err) {
    console.error('complete multipart upload error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to complete multipart upload: ${message}` },
      { status: 500 },
    );
  }
}
