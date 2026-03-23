import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiKeyOrUser } from '@/lib/wallet';
import { scanSidraDeposits, scanBscDeposits, runFullDepositScan } from '@/lib/wallet/deposit-scanner';
import type { WalletNetwork } from '@/lib/wallet/types';

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiKeyOrUser(request);

    const body = await request.json().catch(() => ({}));
    const normalizedNetwork = String(body?.network || '').toLowerCase();
    const maxBlocks = Number(body?.maxBlocks) || undefined;

    let result;

    if (normalizedNetwork === 'sidra') {
      result = await scanSidraDeposits({ maxBlocks });
    } else if (normalizedNetwork === 'bsc') {
      result = await scanBscDeposits({ maxBlocks });
    } else {
      result = await runFullDepositScan({ maxBlocks });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const message = error?.message || 'Failed to sync deposits';
    const status = message.includes('Unauthorized') || message.includes('Admin access') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
