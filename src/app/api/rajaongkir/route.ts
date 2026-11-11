import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingOptions } from '@/lib/rajaongkir';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { destinationCityId, weightInGrams, courier } = body;

    const options = await calculateShippingOptions({
      destinationCityId: destinationCityId || 'jakarta',
      weightInGrams: Number(weightInGrams) || 1000,
      courier,
    });

    return NextResponse.json({ success: true, options });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghitung ongkir' },
      { status: 500 }
    );
  }
}
