import prisma from '@/lib/prisma';

export class CrmService {
  private static getSegment(params: {
    createdAt: Date;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: Date | null;
    now?: Date;
  }) {
    const now = params.now ?? new Date();
    const newCustomerCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const churnCutoff = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const recentlyRegistered = params.createdAt >= newCustomerCutoff;
    const hasRecentOrder = params.lastOrderAt !== null && params.lastOrderAt > churnCutoff;

    // Prioritaskan pelanggan dormant dan loyal, lalu pendaftaran/pembelian baru,
    // agar satu pelanggan hanya masuk ke satu segmen.
    if (params.orderCount > 0 && !hasRecentOrder) return 'CHURN_RISK';
    if (params.orderCount >= 3 && params.totalSpent >= 500000) return 'LOYAL';
    if (recentlyRegistered) return 'NEW_CUSTOMER';
    if (params.orderCount === 1) return 'NEW_CUSTOMER';
    if (params.orderCount === 0) return 'CHURN_RISK';
    if (params.orderCount >= 2) return 'POTENTIAL_LOYAL';
    return 'CHURN_RISK';
  }

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
    const lastOrderAt = settledOrders.reduce<Date | null>((latest, order) => {
      const orderDate = order.paidAt ?? order.createdAt;
      return !latest || orderDate > latest ? orderDate : latest;
    }, null);
    const segment = this.getSegment({
      createdAt: user.createdAt,
      orderCount,
      totalSpent,
      lastOrderAt,
    });

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
      select: { id: true, email: true, name: true, createdAt: true },
    });
    const totalCustomers = customers.length;

    // Ambil transaksi settlement langsung dari D1, bukan kolom ringkasan User
    // yang hanya diperbarui ketika webhook pembayaran berjalan.
    const settledOrders = await prisma.order.findMany({
      where: { status: 'SETTLEMENT' },
      select: { userId: true, grandTotal: true, paidAt: true, createdAt: true },
    });

    const customerStats = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: Date | null }>();
    for (const order of settledOrders) {
      const stats = customerStats.get(order.userId) ?? { orderCount: 0, totalSpent: 0, lastOrderAt: null };
      const orderDate = order.paidAt ?? order.createdAt;
      stats.orderCount += 1;
      stats.totalSpent += order.grandTotal;
      if (!stats.lastOrderAt || orderDate > stats.lastOrderAt) stats.lastOrderAt = orderDate;
      customerStats.set(order.userId, stats);
    }

    const totalRevenue = settledOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const totalOrdersCount = settledOrders.length;
    const activeBuyersCount = [...customerStats.values()].filter((stats) => stats.orderCount > 0).length;
    const repeatBuyersCount = [...customerStats.values()].filter((stats) => stats.orderCount > 1).length;
    const repeatPurchaseRate = activeBuyersCount > 0 ? (repeatBuyersCount / activeBuyersCount) * 100 : 0;

    const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    const enrichedCustomers = customers.map((customer) => {
      const stats = customerStats.get(customer.id) ?? { orderCount: 0, totalSpent: 0, lastOrderAt: null };
      return {
        ...customer,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt,
        crmSegment: this.getSegment({ createdAt: customer.createdAt, ...stats }),
      };
    });
    const segmentDistribution = enrichedCustomers.reduce(
      (distribution, customer) => {
        distribution[customer.crmSegment] = (distribution[customer.crmSegment] ?? 0) + 1;
        return distribution;
      },
      { NEW_CUSTOMER: 0, LOYAL: 0, CHURN_RISK: 0, POTENTIAL_LOYAL: 0 } as Record<string, number>
    );

    return {
      metrics: {
        totalCustomers,
        activeBuyersCount,
        repeatBuyersCount,
        repeatPurchaseRatePercent: Number(repeatPurchaseRate.toFixed(1)),
        averageOrderValue: aov,
        totalRevenue,
        totalOrdersCount,
      },
      segmentDistribution,
      topCustomers: enrichedCustomers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10),
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
