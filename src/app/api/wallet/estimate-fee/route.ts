import { NextRequest, NextResponse } from 'next/server';
import { estimateInternalFee } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    return NextResponse.json(estimateInternalFee(amount));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to estimate fee' },
      { status: 500 }
    );
  }
}
