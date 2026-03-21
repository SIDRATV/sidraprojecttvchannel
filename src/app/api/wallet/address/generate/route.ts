import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDepositAddress, provisionUserWallet, requireAuthenticatedUser } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    await provisionUserWallet(user.id);
    const address = await getOrCreateDepositAddress(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      address: address.address,
      network: address.network,
      createdAt: address.created_at,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate wallet address';
    const status = message.includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
