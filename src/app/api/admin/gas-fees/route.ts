import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getGasFeeBps, setGasFeeBps } from '@/lib/wallet';

const MAX_GAS_FEE_BPS = 2000; // hard ceiling: 20%
const MIN_GAS_FEE_BPS = 0;    // can be set to zero (no gas fee)

// GET — return current gas fee BPS and effective percentage
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'finances');
  if (!auth.ok) return auth.response;

  const bps = await getGasFeeBps();

  return NextResponse.json({
    gas_fee_bps: bps,
    gas_fee_percent: Number((bps / 100).toFixed(4)),
    description: `Withdrawal gas fee: ${(bps / 100).toFixed(2)}% of withdrawal amount`,
  });
}

// POST — update gas fee BPS
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'finances');
  if (!auth.ok) return auth.response;

  let body: { gas_fee_bps?: unknown; gas_fee_percent?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let newBps: number;

  if (body.gas_fee_bps !== undefined) {
    newBps = Number(body.gas_fee_bps);
  } else if (body.gas_fee_percent !== undefined) {
    // Accept percent notation (e.g. 1.5 → 150 BPS)
    newBps = Math.round(Number(body.gas_fee_percent) * 100);
  } else {
    return NextResponse.json({ error: 'Provide gas_fee_bps (integer) or gas_fee_percent (decimal)' }, { status: 400 });
  }

  if (!Number.isFinite(newBps) || newBps < MIN_GAS_FEE_BPS || newBps > MAX_GAS_FEE_BPS) {
    return NextResponse.json(
      { error: `gas_fee_bps must be between ${MIN_GAS_FEE_BPS} and ${MAX_GAS_FEE_BPS} (0–20%)` },
      { status: 400 },
    );
  }

  await setGasFeeBps(newBps);

  // Audit log
  try {
    await auth.supabase.from('wallet_audit_logs' as any).insert({
      actor_user_id: auth.admin.id,
      action: 'admin.gas_fee.updated',
      details: {
        new_bps: newBps,
        new_percent: `${(newBps / 100).toFixed(2)}%`,
        updated_by: auth.admin.email,
      },
    });
  } catch {}

  return NextResponse.json({
    success: true,
    gas_fee_bps: newBps,
    gas_fee_percent: Number((newBps / 100).toFixed(4)),
    message: `Gas fee updated to ${(newBps / 100).toFixed(2)}%`,
  });
}
