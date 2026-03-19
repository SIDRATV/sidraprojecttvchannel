import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, verifyUsernameExists } from '@/lib/wallet';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { username } = await context.params;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (user.username?.toLowerCase() === username.toLowerCase()) {
      return NextResponse.json({ exists: false, username });
    }

    const exists = await verifyUsernameExists(username);
    return NextResponse.json({ exists, username });
  } catch (error: any) {
    const message = error?.message || 'Failed to verify username';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
