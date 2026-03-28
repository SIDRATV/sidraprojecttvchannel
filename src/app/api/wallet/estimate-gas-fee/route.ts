import { NextRequest, NextResponse } from 'next/server';
import { getGasFeeBps } from '@/lib/wallet';

/**
 * POST /api/wallet/estimate-gas-fee
 * Returns the gas fee that will be charged for a blockchain withdrawal.
 * Called before the user confirms the withdrawal so fee is clearly shown.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const bps = await getGasFeeBps();
    const fee = Number(((amount * bps) / 10000).toFixed(8));
    const total = Number((amount + fee).toFixed(8));

    return NextResponse.json({
      amount,
      gas_fee: fee,
      gas_fee_bps: bps,
      gas_fee_percent: Number((bps / 100).toFixed(4)),
      total_deducted: total,
      currency: process.env.WALLET_CURRENCY || 'SIDRA',
      note: fee === 0
        ? 'No gas fee is currently charged for withdrawals.'
        : `A gas fee of ${(bps / 100).toFixed(2)}% (${fee} ${process.env.WALLET_CURRENCY || 'SIDRA'}) will be deducted from your balance.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to estimate gas fee' },
      { status: 500 },
    );
  }
}
