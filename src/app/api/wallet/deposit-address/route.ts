import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDepositAddress, requireAuthenticatedUser } from '@/lib/wallet';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const address = await getOrCreateDepositAddress(user.id);

    return NextResponse.json({
      success: true,
      address: address.address,
      network: address.network,
      createdAt: address.created_at,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to get deposit address';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
