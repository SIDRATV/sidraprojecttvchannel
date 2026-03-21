import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiKeyOrUser, syncDeposits } from '@/lib/wallet';
import type { WalletNetwork } from '@/lib/wallet/types';

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiKeyOrUser(request);

    const body = await request.json().catch(() => ({}));
    const normalizedNetwork = String(body?.network || '').toLowerCase();
    const network: WalletNetwork | undefined =
      normalizedNetwork === 'bsc' || normalizedNetwork === 'bsk'
        ? 'bsc'
        : normalizedNetwork === 'sidra'
          ? 'sidra'
          : undefined;
    const result = await syncDeposits({
      maxBlocks: Number(body.maxBlocks || undefined),
      network,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const message = error?.message || 'Failed to sync deposits';
    const status = message.includes('Unauthorized') || message.includes('Admin access') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
