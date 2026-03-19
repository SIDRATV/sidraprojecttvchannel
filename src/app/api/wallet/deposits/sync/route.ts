import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiKeyOrUser, syncDeposits } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiKeyOrUser(request);

    const body = await request.json().catch(() => ({}));
    const result = await syncDeposits({
      maxBlocks: Number(body.maxBlocks || undefined),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const message = error?.message || 'Failed to sync deposits';
    const status = message.includes('Unauthorized') || message.includes('Admin access') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
