import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { diagnosisR2, R2_BUCKET } from '@/lib/r2';
import { verifyJwt, extractBearerToken } from '@/lib/verifyJwt';

/**
 * GET /api/admin/r2-diagnostic
 * Admin endpoint to test R2 configuration and provide troubleshooting info
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check — admin only
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

    // Check admin
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', jwtPayload.sub)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run R2 diagnosis
    const r2Diag = await diagnosisR2();

    // Get env info (safe to expose to admin)
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '(not set)';
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || '(not set)';
    const videoEndpoint = process.env.CLOUDFLARE_R2_VIDEO_ENDPOINT || '(not set)';
    const hasCreds = !!(
      process.env.CLOUDFLARE_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY
    );

    return NextResponse.json({
      success: r2Diag.ok,
      message: r2Diag.message,
      config: {
        accountId,
        bucket: R2_BUCKET,
        endpoint,
        videoEndpoint,
        credentialsConfigured: hasCreds,
      },
      cors: {
        info: 'CORS must be configured in Cloudflare R2 Dashboard > Settings > CORS rules',
        requiredOrigins: [
          process.env.NEXT_PUBLIC_SITE_URL || 'https://sidraprojecttvchannel-pi.vercel.app',
          'http://localhost:3000',
        ],
        requiredMethods: ['PUT', 'POST', 'GET', 'OPTIONS'],
        requiredHeaders: ['Content-Type', '*'],
        exposeHeaders: ['ETag', 'x-amz-version-id'],
      },
      troubleshooting: {
        corsError:
          'If you see "Network connection failed" during upload, check CORS settings in Cloudflare R2 Dashboard',
        endpointFormat:
          'Endpoint must NOT include bucket name. Should be: https://{accountId}.r2.cloudflarestorage.com',
        forcePathStyle: 'AWS SDK must use forcePathStyle: true for R2 compatibility',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Diagnostic failed: ${message}` },
      { status: 500 },
    );
  }
}
