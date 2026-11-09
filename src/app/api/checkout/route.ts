import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { InventoryService } from '@/services/inventory.service';
import { PromotionService } from '@/services/promotion.service';
import { createMidtransSnapTransaction } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      items,
      shippingCity,
      shippingAddress,
      courierName,
      shippingFee,
      promoCode,
    } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data pesanan tidak lengkap' },
        { status: 400 }
      );
    }

    // 1. VALIDASI STOK SERVER-SIDE (ANTI-OVERSELLING GUARD)
    const stockCheck = await InventoryService.validateStockForCheckout(items);
    if (!stockCheck.isValid) {
      return NextResponse.json(
        { success: false, error: stockCheck.error },
        { status: 422 } // Unprocessable Entity: Stok habis / kurang
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. KALKULASI SUB-TOTAL & BIAYA KEMASAN VACUUM
    const itemsTotal = stockCheck.items.reduce((sum, it) => sum + it.unitPrice * it.requestedQty, 0);
    const packagingFee = stockCheck.items.reduce((sum, it) => sum + it.vacuumFee * it.requestedQty, 0);
    const calculatedShipping = Number(shippingFee) || 0;

    // 3. VALIDASI KODE PROMO SERVER-SIDE (JIKA ADA)
    let discountTotal = 0;
    let validPromotionId = null;

    if (promoCode && promoCode.trim() !== '') {
      const promoResult = await PromotionService.validatePromoCode({
        promoCode: promoCode.trim(),
        userId: user.id,
        subtotal: itemsTotal,
        shippingFee: calculatedShipping,
      });

      if (!promoResult.isValid) {
        return NextResponse.json(
          { success: false, error: promoResult.error },
          { status: 400 }
        );
      }

      discountTotal = promoResult.promotion?.discountAmount || 0;
      validPromotionId = promoResult.promotion?.id || null;
    }

    const grandTotal = Math.max(0, itemsTotal + packagingFee + calculatedShipping - discountTotal);
    const invoiceNumber = `INV-SLT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. BUAT ORDER DI DATABASE
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId: user.id,
        itemsTotal,
        packagingFee,
        shippingFee: calculatedShipping,
        discountTotal,
        grandTotal,
        promotionId: validPromotionId,
        status: 'PENDING_PAYMENT',
        courierName: courierName || 'JNE - REG',
        shippingAddress: shippingAddress || 'Jl. Sam Ratulangi No. 45, Manado',
        shippingCity: shippingCity || 'Manado',
        postalCode: '95111',
        items: {
          create: items.map((it: any) => {
            const matched = stockCheck.items.find((si) => si.productId === it.productId);
            const unitPrice = matched ? matched.unitPrice : 0;
            const vacFee = it.packagingChoice === 'VACUUM_SEALED' && matched ? matched.vacuumFee : 0;
            return {
              productId: it.productId,
              quantity: it.quantity,
              unitPrice,
              packagingChoice: it.packagingChoice || 'STANDARD',
              subtotal: (unitPrice + vacFee) * it.quantity,
            };
          }),
        },
      },
    });

    // 5. GENERATE TOKEN SNAP MIDTRANS
    const snapResult = await createMidtransSnapTransaction({
      orderId: order.invoiceNumber,
      grossAmount: grandTotal,
      customerDetails: {
        firstName: user.name,
        email: user.email,
        phone: user.phone || '081234567890',
      },
      itemDetails: [
        ...stockCheck.items.map((it) => ({
          id: it.productId,
          price: it.unitPrice + it.vacuumFee,
          quantity: it.requestedQty,
          name: `${it.productName}${it.vacuumFee > 0 ? ' [Vacuum]' : ''}`,
        })),
        {
          id: 'SHIPPING_FEE',
          price: calculatedShipping,
          quantity: 1,
          name: `Ongkir (${courierName || 'Ekspedisi'})`,
        },
        ...(discountTotal > 0
          ? [
              {
                id: 'PROMO_DISCOUNT',
                price: -discountTotal,
                quantity: 1,
                name: `Diskon Voucher Promo`,
              },
            ]
          : []),
      ],
    });

    // Simpan token Snap ke order
    await prisma.order.update({
      where: { id: order.id },
      data: { snapToken: snapResult.token },
    });

    return NextResponse.json({
      success: true,
      message: 'Order berhasil dibuat, silakan selesaikan pembayaran.',
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      snapToken: snapResult.token,
      redirectUrl: snapResult.redirectUrl,
      grandTotal,
    });
  } catch (error: any) {
    console.error('[Checkout API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server saat checkout' },
      { status: 500 }
    );
  }
}
