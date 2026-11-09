import prisma from '@/lib/prisma';

export class CrmService {
  /**
   * 1. REKALKULASI SEGMEN CRM SATU PELANGGAN
   * Dipanggil otomatis setiap kali order berhasil terkonfirmasi 'settlement'.
   */
  static async recalculateUserSegment(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: { status: 'SETTLEMENT' },
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    const settledOrders = user.orders;
    const orderCount = settledOrders.length;
    const totalSpent = settledOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const lastOrder = settledOrders[0];
    const lastOrderAt = lastOrder?.paidAt || null;

    const now = new Date();
    const daysSinceLastOrder = lastOrderAt
      ? Math.floor((now.getTime() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let segment = 'NEW_CUSTOMER';

    // Algoritma Segmentasi Berdasarkan RFM (Recency, Frequency, Monetary)
    if (orderCount === 0) {
      segment = 'NEW_CUSTOMER';
    } else if (daysSinceLastOrder >= 45) {
      // Pelanggan Tidak Aktif / Risiko Churn jika tidak ada transaksi baru > 45 hari
      segment = 'CHURN_RISK';
    } else if (orderCount >= 3 && totalSpent >= 500000) {
      // Pelanggan Loyal jika repeat order minimal 3 kali & belanja >= 500k
      segment = 'LOYAL';
    } else if (orderCount >= 2) {
      segment = 'POTENTIAL_LOYAL';
    } else {
      segment = 'NEW_CUSTOMER';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        orderCount,
        totalSpent,
        lastOrderAt,
        crmSegment: segment,
      },
    });

    return updatedUser;
  }

  /**
   * 2. REKALKULASI MASSAL SELURUH PELANGGAN
   */
  static async recalculateAllCustomerSegments() {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true },
    });

    for (const u of users) {
      await this.recalculateUserSegment(u.id);
    }
  }

  /**
   * 3. DASHBOARD METRIK CRM
   * Menampilkan Real-time Jumlah Pelanggan, Repeat Purchase Rate (%), dan AOV
   */
  static async getCrmDashboardMetrics() {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { totalSpent: 'desc' },
    });

    const totalCustomers = customers.length;

    // Pelanggan yang pernah melakukan transaksi
    const activeBuyers = customers.filter((c) => c.orderCount >= 1);
    const repeatBuyers = customers.filter((c) => c.orderCount > 1);

    // Repeat Purchase Rate (%) = (Pembeli berulang / Total pembeli aktif) * 100
    const repeatPurchaseRate =
      activeBuyers.length > 0 ? ((repeatBuyers.length / activeBuyers.length) * 100).toFixed(1) : '0.0';

    // Total Pesanan Sukses & Omzet
    const settledOrders = await prisma.order.findMany({
      where: { status: 'SETTLEMENT' },
      select: { grandTotal: true },
    });

    const totalRevenue = settledOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalOrdersCount = settledOrders.length;

    // Average Order Value (AOV) = Total Pendapatan / Total Transaksi Sukses
    const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    // Distribusi Segmen Pelanggan
    const segmentDistribution = {
      NEW_CUSTOMER: customers.filter((c) => c.crmSegment === 'NEW_CUSTOMER').length,
      LOYAL: customers.filter((c) => c.crmSegment === 'LOYAL').length,
      CHURN_RISK: customers.filter((c) => c.crmSegment === 'CHURN_RISK').length,
      POTENTIAL_LOYAL: customers.filter((c) => c.crmSegment === 'POTENTIAL_LOYAL').length,
    };

    return {
      metrics: {
        totalCustomers,
        activeBuyersCount: activeBuyers.length,
        repeatBuyersCount: repeatBuyers.length,
        repeatPurchaseRatePercent: parseFloat(repeatPurchaseRate),
        averageOrderValue: aov,
        totalRevenue,
        totalOrdersCount,
      },
      segmentDistribution,
      topCustomers: customers.slice(0, 10),
    };
  }

  /**
   * 4. AKSI RETENSI TERINTEGRASI: KIRIM PROMO KHUSUS KE SEGMEN
   * Misal: Membuat voucher diskon khusus 25% yang HANYA bisa diklaim oleh segmen CHURN_RISK
   */
  static async triggerRetentionCampaign(params: {
    targetSegment: string;
    discountPercent: number;
    campaignName?: string;
  }) {
    const code = `RETENSI-${params.targetSegment.substring(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 14); // Berlaku 14 hari

    // Cari jumlah pelanggan di segmen tersebut
    const targetUsers = await prisma.user.findMany({
      where: { crmSegment: params.targetSegment },
    });

    const promo = await prisma.promotion.create({
      data: {
        code,
        name: params.campaignName || `Promo Spesial Kangen Oleh-Oleh (${params.targetSegment})`,
        description: `Diskon spesial ${params.discountPercent}% khusus pelanggan setia segmen ${params.targetSegment}`,
        type: 'PERCENTAGE_DISCOUNT',
        value: params.discountPercent,
        maxDiscountAmount: 50000,
        minOrderAmount: 100000,
        totalQuota: Math.max(50, targetUsers.length * 2),
        limitPerUser: 1,
        startDate: now,
        endDate: expiryDate,
        isActive: true,
        targetSegment: params.targetSegment, // Terkunci ketat ke segmen tujuan
      },
    });

    return {
      success: true,
      message: `Voucher retensi ${code} berhasil dibuat untuk ${targetUsers.length} pelanggan segmen ${params.targetSegment}.`,
      promo,
      targetedUserCount: targetUsers.length,
    };
  }
}
