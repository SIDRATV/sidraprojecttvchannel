import { NextRequest, NextResponse } from 'next/server';
import { internalTransfer, requireAuthenticatedUser, requireOptional2FA } from '@/lib/wallet';
import { rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // 10 internal transfers per IP per minute
  const rl = rateLimit(request, { limit: 10, windowMs: 60_000, prefix: 'wallet-internal' });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many transfer requests. Please slow down.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const user = await requireAuthenticatedUser(request);
    requireOptional2FA(request);

    const body = await request.json();
    const result = await internalTransfer({
      senderUserId: user.id,
      recipientUsername: String(body.recipientUsername || ''),
      amount: Number(body.amount),
      description: body.description ? String(body.description) : undefined,
    });

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      message: 'Transfer sent successfully',
      amount: result.amount,
      fee: result.fee,
      status: result.status,
      referenceId: result.referenceId,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to process transfer';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
