import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';
import { diagnosisR2 } from '@/lib/r2';

/**
 * GET /api/admin/diagnostic/r2
 * Test Cloudflare R2 connectivity and credentials
 */
export async function GET(request: NextRequest) {
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

    // Run diagnosis
    const diagnosis = await diagnosisR2();

    // Return result
    return NextResponse.json({
      success: diagnosis.ok,
      message: diagnosis.message,
      timestamp: new Date().toISOString(),
      env: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'Using default format',
        bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sidratvstoragevideopremium (default)',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Diagnostic failed: ${message}` },
      { status: 500 },
    );
  }
}
