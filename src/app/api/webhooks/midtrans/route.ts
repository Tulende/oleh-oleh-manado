import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMidtransSignature, MidtransNotificationPayload } from '@/lib/midtrans';
import { InventoryService } from '@/services/inventory.service';
import { PromotionService } from '@/services/promotion.service';
import { CrmService } from '@/services/crm.service';

export async function POST(req: NextRequest) {
  try {
    const body: MidtransNotificationPayload = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID tidak ditemukan' }, { status: 400 });
    }

    // 1. CARI PESANAN DI DATABASE
    const order = await prisma.order.findUnique({
      where: { invoiceNumber: order_id },
      include: { items: true, promotion: true },
    });

    if (!order) {
      console.warn(`[Midtrans Webhook] Order dengan invoice ${order_id} tidak ditemukan.`);
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    // 2. VALIDASI SIGNATURE KEY SHA-512 (Jika signature_key disertakan oleh Midtrans)
    if (signature_key) {
      const isValidSignature = verifyMidtransSignature(body);
      if (!isValidSignature && process.env.NODE_ENV === 'production') {
        console.error(`[Midtrans Webhook Security Alert] Signature key tidak cocok untuk order ${order_id}`);
        return NextResponse.json({ error: 'Invalid Signature Key' }, { status: 403 });
      }
    }

    console.log(`[Midtrans Webhook] Menerima status "${transaction_status}" untuk order #${order.invoiceNumber}`);

    // 3. LOGIKA PEMOTONGAN STOK HANYA SAAT SETTLEMENT / CAPTURE
    if (
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    ) {
      // a. Update status order menjadi SETTLEMENT
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'SETTLEMENT',
          midtransTransactionId: transaction_id || null,
          paymentType: payment_type || 'midtrans_sandbox',
          paidAt: new Date(),
        },
      });

      // b. Pemotongan Stok Transaksional & Audit Log Pergerakan Stok
      const stockResult = await InventoryService.deductStockOnSettlement(order.id);
      if (stockResult.lowStockAlerts && stockResult.lowStockAlerts.length > 0) {
        console.warn(`[Inventory Alert] Produk mencapai batas minimum stok:`, stockResult.lowStockAlerts);
      }

      // c. Rekam Analytics Pemakaian Promo jika digunakan
      if (order.promotionId && order.discountTotal > 0) {
        await PromotionService.recordPromoUsage({
          promotionId: order.promotionId,
          userId: order.userId,
          orderId: order.id,
          discountApplied: order.discountTotal,
          orderTotalRevenue: order.grandTotal,
        });
      }

      // d. Segmentasi Pelanggan Otomatis (Rekalkulasi RFM)
      await CrmService.recalculateUserSegment(order.userId);

      return NextResponse.json({
        status: 'success',
        message: 'Pembayaran settlement terkonfirmasi. Stok terpotong dan metrik CRM terupdate.',
      });
    }

    // 4. RESTOCK OTOMATIS JIKA TRANSAKSI DIBATALKAN / EXPIRED / REFUND
    else if (
      transaction_status === 'cancel' ||
      transaction_status === 'expire' ||
      transaction_status === 'deny'
    ) {
      const newStatus = transaction_status === 'expire' ? 'EXPIRED' : 'CANCELLED';

      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      // Kembalikan stok jika sebelumnya pernah dipotong (misal order dibatalkan setelah settlement)
      await InventoryService.restockOnCancelled(order.id, transaction_status);

      return NextResponse.json({
        status: 'success',
        message: `Order #${order.invoiceNumber} berstatus ${newStatus}. Log pengembalian stok dicatat.`,
      });
    } else if (transaction_status === 'refund') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' },
      });

      await InventoryService.restockOnCancelled(order.id, 'refund_midtrans');

      return NextResponse.json({
        status: 'success',
        message: `Order #${order.invoiceNumber} di-refund. Stok berhasil dikembalikan ke inventory.`,
      });
    }

    // Status lainnya (misal: pending)
    return NextResponse.json({ status: 'ok', message: 'Status pending diterima' });
  } catch (error: any) {
    console.error('[Midtrans Webhook Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
