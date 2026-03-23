import { NextRequest, NextResponse } from 'next/server';
import { walletConfig } from '@/lib/wallet/config';
import { testAllRpcConnections } from '@/lib/wallet/deposit-scanner';
import { isScannerAvailable, getScannerRpcHealth } from '@/lib/wallet/scanner-client';

/**
 * GET /api/wallet/rpc-health
 *
 * Returns RPC connectivity status for all configured blockchain networks.
 * Uses Railway scanner if available, otherwise tests locally.
 * Protected by admin API key or CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-api-key');
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  const validAdminKey = walletConfig.adminApiKey;
  const validCronSecret = process.env.CRON_SECRET;

  const isAuthorized =
    (validAdminKey && adminKey === validAdminKey) ||
    (validCronSecret && cronSecret === validCronSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const railwayAvailable = await isScannerAvailable();

    if (railwayAvailable) {
      const scannerHealth = await getScannerRpcHealth();
      return NextResponse.json({
        ...scannerHealth,
        source: 'railway-scanner',
        timestamp: new Date().toISOString(),
      });
    }

    const results = await testAllRpcConnections();
    const allConnected = results.every((r) => r.connected);

    return NextResponse.json({
      ok: allConnected,
      source: 'local',
      timestamp: new Date().toISOString(),
      networks: results,
    });
  } catch (error: any) {
    console.error('[rpc-health] Error:', error?.message);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Health check failed' },
      { status: 500 }
    );
  }
}
