import { NextRequest, NextResponse } from 'next/server';
import { processPendingWithdrawals, requireAdminApiKeyOrUser } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiKeyOrUser(request);

    const body = await request.json().catch(() => ({}));
    const result = await processPendingWithdrawals({
      onlyFailed: Boolean(body.onlyFailed ?? true),
      limit: Number(body.limit || 10),
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to retry withdrawals';
    const status = message.includes('Unauthorized') || message.includes('Admin access') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
