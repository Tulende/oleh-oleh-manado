import { NextRequest, NextResponse } from 'next/server';
import { PromotionService } from '@/services/promotion.service';
import { getRequestSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    if (!session || session.role !== 'CUSTOMER') {
      return NextResponse.json({ isValid: false, error: 'Silakan login sebagai pembeli untuk menggunakan promo.' }, { status: 401 });
    }

    const body = (await req.json()) as any;
    const { promoCode, subtotal, shippingFee } = body;

    if (!promoCode) {
      return NextResponse.json(
        { isValid: false, error: 'Kode promo dan data user wajib diisi' },
        { status: 400 }
      );
    }

    const result = await PromotionService.validatePromoCode({
      promoCode,
      userId: session.id,
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
