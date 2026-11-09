import prisma from '@/lib/prisma';

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
  packagingChoice?: string;
}

export interface InventoryCheckResult {
  isValid: boolean;
  error?: string;
  items: Array<{
    productId: string;
    productName: string;
    requestedQty: number;
    availableStock: number;
    unitPrice: number;
    subtotal: number;
    vacuumFee: number;
  }>;
}

export class InventoryService {
  /**
   * 1. VALIDASI & ANTI-OVERSELLING SEVER-SIDE
   * Menolak transaksi jika stok di DB < kuantitas yang diminta saat checkout.
   */
  static async validateStockForCheckout(items: CheckoutItemRequest[]): Promise<InventoryCheckResult> {
    if (!items || items.length === 0) {
      return { isValid: false, error: 'Keranjang belanja kosong', items: [] };
    }

    const validatedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return {
          isValid: false,
          error: `Produk dengan ID ${item.productId} tidak ditemukan`,
          items: [],
        };
      }

      // Aturan Keras Anti-Overselling:
      if (product.stock < item.quantity) {
        return {
          isValid: false,
          error: `Stok "${product.name}" tidak mencukupi (Tersisa: ${product.stock}, Diminta: ${item.quantity})`,
          items: [],
        };
      }

      const vacuumFee = item.packagingChoice === 'VACUUM_SEALED' ? product.vacuumExtraFee : 0;
      const subtotal = product.price * item.quantity + vacuumFee * item.quantity;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        requestedQty: item.quantity,
        availableStock: product.stock,
        unitPrice: product.price,
        subtotal,
        vacuumFee,
      });
    }

    return { isValid: true, items: validatedItems };
  }

  /**
   * 2. LOGIC PEMOTONGAN STOK TRANSAKSIONAL (WEBHOOK MIDTRANS SETTLEMENT)
   * Stok HANYA terpotong saat pembayaran berstatus 'settlement' / 'capture'.
   */
  static async deductStockOnSettlement(orderId: string, actorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new Error(`Order ${orderId} tidak ditemukan.`);
      }

      // Cegah pemotongan ganda jika webhook dipanggil berulang (idempotency guard)
      const existingLog = await tx.inventoryLog.findFirst({
        where: { orderId: order.id, type: 'OUT_SETTLEMENT' },
      });

      if (existingLog) {
        console.log(`[Idempotency] Stok untuk order ${order.invoiceNumber} sudah pernah dipotong.`);
        return { success: true, message: 'Stock already deducted' };
      }

      const lowStockAlerts = [];

      for (const item of order.items) {
        const product = item.product;
        const stockBefore = product.stock;
        const stockAfter = Math.max(0, stockBefore - item.quantity);

        // Update kuantitas stok di tabel Product
        await tx.product.update({
          where: { id: product.id },
          data: { stock: stockAfter },
        });

        // Catat ke Audit Log Pergerakan Stok
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            orderId: order.id,
            type: 'OUT_SETTLEMENT',
            quantityChange: -item.quantity,
            stockBefore,
            stockAfter,
            reason: `Pemotongan otomatis pembayaran lunas Midtrans #${order.invoiceNumber}`,
            actorId: actorId || null,
          },
        });

        // Peringatan Stok Menipis (Threshold Minimum Stock)
        if (stockAfter <= product.minStockThreshold) {
          lowStockAlerts.push({
            productId: product.id,
            productName: product.name,
            currentStock: stockAfter,
            threshold: product.minStockThreshold,
          });
        }
      }

      return { success: true, lowStockAlerts };
    });
  }

  /**
   * 3. RESTOCK OTOMATIS SAAT ORDER BATAL / EXPIRED / REFUND
   */
  static async restockOnCancelled(orderId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });

      if (!order) return;

      // Cek apakah stok sebelumnya pernah dipotong
      const deductionLog = await tx.inventoryLog.findFirst({
        where: { orderId: order.id, type: 'OUT_SETTLEMENT' },
      });

      if (!deductionLog) {
        // Jika belum settlement (masih pending), stok belum pernah dipotong jadi tidak perlu dikembalikan
        return { success: true, message: 'No stock deduction to revert' };
      }

      for (const item of order.items) {
        const product = item.product;
        const stockBefore = product.stock;
        const stockAfter = stockBefore + item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: stockAfter },
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            orderId: order.id,
            type: 'CANCEL_RESTOCK',
            quantityChange: item.quantity,
            stockBefore,
            stockAfter,
            reason: `Pengembalian stok transaksi batal/expired (${reason}) #${order.invoiceNumber}`,
          },
        });
      }

      return { success: true };
    });
  }

  /**
   * 4. PENYESUAIAN STOK MANUAL / RESTOCK UMKM (Audit Log In-Purchase)
   */
  static async manualAdjustStock(params: {
    productId: string;
    quantityChange: number;
    type: 'IN_PURCHASE' | 'ADJUSTMENT_DAMAGE' | 'ADJUSTMENT_AUDIT';
    reason: string;
    actorId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: params.productId } });
      if (!product) throw new Error('Produk tidak ditemukan');

      const stockBefore = product.stock;
      const stockAfter = Math.max(0, stockBefore + params.quantityChange);

      await tx.product.update({
        where: { id: product.id },
        data: { stock: stockAfter },
      });

      const log = await tx.inventoryLog.create({
        data: {
          productId: product.id,
          type: params.type,
          quantityChange: params.quantityChange,
          stockBefore,
          stockAfter,
          reason: params.reason,
          actorId: params.actorId || null,
        },
      });

      return { product, log };
    });
  }

  /**
   * 5. MONITORING STOK & DAFTAR LOW-STOCK
   */
  static async getInventoryOverview() {
    const products = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
    });

    const lowStockItems = products.filter((p) => p.stock <= p.minStockThreshold);

    const recentLogs = await prisma.inventoryLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        order: { select: { invoiceNumber: true } },
      },
    });

    return {
      totalProducts: products.length,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      products,
      recentLogs,
    };
  }
}
