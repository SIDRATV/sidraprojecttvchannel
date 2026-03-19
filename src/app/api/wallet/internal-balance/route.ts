import { NextRequest, NextResponse } from 'next/server';
import { getInternalBalance, requireAuthenticatedUser } from '@/lib/wallet';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const balance = await getInternalBalance(user.id);

    return NextResponse.json(balance);
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch balance';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
