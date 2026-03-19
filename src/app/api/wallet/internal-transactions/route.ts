import { NextRequest, NextResponse } from 'next/server';
import { getInternalTransactions, requireAuthenticatedUser } from '@/lib/wallet';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const params = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number(params.get('limit') || 20), 1), 100);
    const offset = Math.max(Number(params.get('offset') || 0), 0);

    const transactions = await getInternalTransactions(user.id, limit, offset);

    return NextResponse.json(transactions);
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch transactions';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
