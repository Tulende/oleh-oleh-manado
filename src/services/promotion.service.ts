import prisma from '@/lib/prisma';

export interface ValidatePromoRequest {
  promoCode: string;
  userId: string;
  subtotal: number;
  shippingFee: number;
}

export interface PromoValidationResult {
  isValid: boolean;
  error?: string;
  promotion?: {
    id: string;
    code: string;
    name: string;
    type: string;
    discountAmount: number;
    targetSegment?: string | null;
  };
}

export class PromotionService {
  /**
   * 1. VALIDASI SERVER-SIDE KODE PROMOSI
   * Memvalidasi tanggal, kuota, limit per user, minimum order, dan segmen CRM
   */
  static async validatePromoCode(params: ValidatePromoRequest): Promise<PromoValidationResult> {
    const { promoCode, userId, subtotal, shippingFee } = params;

    const promo = await prisma.promotion.findUnique({
      where: { code: promoCode.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return { isValid: false, error: 'Kode promo tidak ditemukan atau tidak aktif' };
    }

    const now = new Date();

    // Validasi Tanggal Berlaku
    if (now < promo.startDate) {
      return { isValid: false, error: 'Promo ini belum dimulai' };
    }
    if (now > promo.endDate) {
      return { isValid: false, error: 'Masa berlaku kode promo telah berakhir' };
    }

    // Validasi Kuota Global
    if (promo.usedQuota >= promo.totalQuota) {
      return { isValid: false, error: 'Kuota penukaran kode promo telah habis' };
    }

    // Validasi Minimum Belanja
    if (subtotal < promo.minOrderAmount) {
      return {
        isValid: false,
        error: `Minimum belanja untuk promo ini adalah Rp ${promo.minOrderAmount.toLocaleString('id-ID')}`,
      };
    }

    // Validasi Limit per User & Segmen CRM
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        promoUsages: {
          where: { promotionId: promo.id },
        },
      },
    });

    if (!user) {
      return { isValid: false, error: 'User tidak valid' };
    }

    if (user.promoUsages.length >= promo.limitPerUser) {
      return { isValid: false, error: 'Anda telah mencapai batas maksimal penggunaan voucher ini' };
    }

    // TARGET PROMO SEGMEN CRM:
    // Jika voucher dikunci khusus untuk segmen tertentu (misal: "CHURN_RISK" atau "LOYAL")
    if (promo.targetSegment && promo.targetSegment !== user.crmSegment) {
      return {
        isValid: false,
        error: `Voucher khusus untuk segmen ${promo.targetSegment}. Akun Anda saat ini berada di segmen ${user.crmSegment}.`,
      };
    }

    // Kalkulasi Besaran Diskon Berdasarkan Jenis Promo
    let discountAmount = 0;

    if (promo.type === 'PERCENTAGE_DISCOUNT') {
      discountAmount = (subtotal * promo.value) / 100;
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else if (promo.type === 'FIXED_DISCOUNT') {
      discountAmount = Math.min(promo.value, subtotal);
    } else if (promo.type === 'FREE_SHIPPING') {
      discountAmount = promo.value > 0 ? Math.min(promo.value, shippingFee) : shippingFee;
    } else if (promo.type === 'FLASH_SALE') {
      discountAmount = (subtotal * promo.value) / 100;
    }

    return {
      isValid: true,
      promotion: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        discountAmount: Math.round(discountAmount),
        targetSegment: promo.targetSegment,
      },
    };
  }

  /**
   * 2. REKAM PENGGUNAAN PROMOSI & UPDATE ANALYTICS
   * Dipanggil saat order terkonfirmasi settlement
   */
  static async recordPromoUsage(params: {
    promotionId: string;
    userId: string;
    orderId: string;
    discountApplied: number;
    orderTotalRevenue: number;
  }) {
    await prisma.$transaction([
      // Buat riwayat pemakaian voucher
      prisma.promotionUsage.create({
        data: {
          promotionId: params.promotionId,
          userId: params.userId,
          orderId: params.orderId,
          discountApplied: params.discountApplied,
        },
      }),
      // Update metrik analytics voucher
      prisma.promotion.update({
        where: { id: params.promotionId },
        data: {
          usedQuota: { increment: 1 },
          totalDiscountGiven: { increment: params.discountApplied },
          totalRevenueGenerated: { increment: params.orderTotalRevenue },
        },
      }),
    ]);
  }

  /**
   * 3. LAPORAN ANALYTICS PROMOSI UNTUK ADMIN
   */
  static async getPromotionAnalytics() {
    const promotions = await prisma.promotion.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalDiscountAll = promotions.reduce((acc, p) => acc + p.totalDiscountGiven, 0);
    const totalRevenueAll = promotions.reduce((acc, p) => acc + p.totalRevenueGenerated, 0);

    return {
      promotions,
      summary: {
        totalVouchers: promotions.length,
        totalDiscountGiven: totalDiscountAll,
        totalRevenueGenerated: totalRevenueAll,
        roiRatio: totalDiscountAll > 0 ? (totalRevenueAll / totalDiscountAll).toFixed(2) : 'N/A',
      },
    };
  }
}
