import { NextRequest, NextResponse } from 'next/server';
import { getWalletMonitoring, requireAdminApiKeyOrUser } from '@/lib/wallet';

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiKeyOrUser(request);
    const monitoring = await getWalletMonitoring();

    return NextResponse.json({ success: true, ...monitoring });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch monitoring data';
    const status = message.includes('Unauthorized') || message.includes('Admin access') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
