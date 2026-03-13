import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/wallet/internal-transactions
 * Get user's internal transaction history
 */
export async function GET(req: NextRequest) {
  try {
    // Get auth token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Get pagination params
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // TODO: Implement the following:
    // 1. Verify auth token and get user ID
    // 2. Query database for user's transactions (both sent and received)
    // 3. Sort by timestamp descending
    // 4. Apply limit and offset for pagination
    // 5. Return transaction list

    // Mock response
    return NextResponse.json([
      {
        id: 'TXN_001',
        sender: 'user_123',
        recipient: 'user_456',
        amount: 10.5,
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: 'Payment',
      },
    ]);
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
