import { NextRequest, NextResponse } from 'next/server';
import { requestWithdrawal, requireAuthenticatedUser, requireOptional2FA } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    requireOptional2FA(request);

    const body = await request.json();
    const result = await requestWithdrawal({
      userId: user.id,
      toAddress: String(body.toAddress || ''),
      amount: Number(body.amount),
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
