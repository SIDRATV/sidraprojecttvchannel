import { NextRequest, NextResponse } from 'next/server';
import { requestWithdrawal, requireAuthenticatedUser, requireOptional2FA } from '@/lib/wallet';
import { rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // 5 withdrawal requests per IP per minute — stricter than transfers
  const rl = rateLimit(request, { limit: 5, windowMs: 60_000, prefix: 'wallet-withdraw' });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many withdrawal requests. Please slow down.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const user = await requireAuthenticatedUser(request);
    requireOptional2FA(request);

    const body = await request.json();
    const normalizedNetwork = String(body?.network || '').toLowerCase();
    const network = normalizedNetwork === 'bsc' || normalizedNetwork === 'bsk'
      ? 'bsc'
      : normalizedNetwork === 'sidra'
        ? 'sidra'
        : undefined;
    const result = await requestWithdrawal({
      userId: user.id,
      toAddress: String(body.toAddress || ''),
      amount: Number(body.amount),
      network,
      description: body.description ? String(body.description) : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Withdrawal queued successfully',
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to request withdrawal';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
