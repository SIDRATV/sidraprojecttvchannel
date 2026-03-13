import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/wallet/verify-username/[username]
 * Verify if a username exists
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // TODO: Implement the following:
    // 1. Query database to check if username exists
    // 2. Make sure it's not the current user
    // 3. Return existence status

    // Mock response
    return NextResponse.json({
      exists: username.toLowerCase() !== 'invalid_user',
      username,
    });
  } catch (error: any) {
    console.error('Error verifying username:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify username' },
      { status: 500 }
    );
  }
}
