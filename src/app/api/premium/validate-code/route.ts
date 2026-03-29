import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode } from '@/lib/premium/service';

// POST /api/premium/validate-code — validate a discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, planId } = body;

    if (!code) {
      return NextResponse.json({ valid: false, discountPercent: 0, message: 'Code requis' });
    }

    const result = await validateDiscountCode(code, planId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, discountPercent: 0, message: 'Erreur de validation' });
  }
}
