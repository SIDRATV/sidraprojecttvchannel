import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/wallet/estimate-fee
 * Estimate transfer fee
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // TODO: Implement fee calculation:
    // Examples:
    // - Fixed fee: 0.1 SIDRA
    // - Percentage fee: amount * 0.01 (1%)
    // - Tiered fee: based on amount ranges
    
    // Mock: 1% fee
    const fee = amount * 0.01;

    return NextResponse.json({
      amount,
      fee: parseFloat(fee.toFixed(4)),
      total: parseFloat((amount + fee).toFixed(4)),
      feePercentage: 1,
    });
  } catch (error: any) {
    console.error('Error estimating fee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate fee' },
      { status: 500 }
    );
  }
}
