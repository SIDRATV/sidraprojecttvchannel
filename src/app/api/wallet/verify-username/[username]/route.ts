import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, verifyRecipient } from '@/lib/wallet';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { username } = await context.params;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
    }

    const input = username.trim().toLowerCase();

    // Prevent self-transfer by username or email
    if (
      user.username?.toLowerCase() === input ||
      user.email?.toLowerCase() === input
    ) {
      return NextResponse.json({ exists: false, error: 'Cannot transfer to yourself' });
    }

    const recipient = await verifyRecipient(input);
    if (!recipient) {
      return NextResponse.json({ exists: false });
    }

    // Mask email for privacy: show first 2 chars + ***@domain
    const maskedEmail = recipient.email
      ? recipient.email.slice(0, 2) + '***@' + recipient.email.split('@')[1]
      : null;

    return NextResponse.json({
      exists: true,
      username: recipient.username,
      displayName: recipient.full_name || recipient.username || 'User',
      matchedBy: recipient.matchedBy,
      maskedEmail,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to verify recipient';
    const status = message.includes('Unauthorized') ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
