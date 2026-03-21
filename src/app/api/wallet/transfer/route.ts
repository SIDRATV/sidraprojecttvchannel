import { NextRequest, NextResponse } from 'next/server';
import { internalTransfer, requireAuthenticatedUser, requireOptional2FA } from '@/lib/wallet';

export async function POST(request: NextRequest) {
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
