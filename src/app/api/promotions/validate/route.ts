import { NextRequest, NextResponse } from 'next/server';
import { PromotionService } from '@/services/promotion.service';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { promoCode, userId, subtotal, shippingFee } = body;

    if (!promoCode || !userId) {
      return NextResponse.json(
        { isValid: false, error: 'Kode promo dan data user wajib diisi' },
        { status: 400 }
      );
    }

    const result = await PromotionService.validatePromoCode({
      promoCode,
      userId,
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
    });

    if (!result.isValid) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { isValid: false, error: error.message || 'Gagal memvalidasi promo' },
      { status: 500 }
    );
  }
}
