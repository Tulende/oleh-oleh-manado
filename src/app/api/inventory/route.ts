import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/services/inventory.service';
import { getRequestSession } from '@/lib/auth';

export async function GET() {
  try {
    const data = await InventoryService.getInventoryOverview();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data inventori' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses admin diperlukan.' }, { status: 403 });
    }

    const body = (await req.json()) as any;
    const { productId, quantityChange, type, reason, actorId } = body;

    if (!productId || quantityChange === undefined || !type || !reason) {
      return NextResponse.json(
        { success: false, error: 'Parameter mutasi stok tidak lengkap' },
        { status: 400 }
      );
    }

    const result = await InventoryService.manualAdjustStock({
      productId,
      quantityChange: Number(quantityChange),
      type,
      reason,
      actorId,
    });

    return NextResponse.json({
      success: true,
      message: 'Mutasi inventori berhasil dicatat ke audit log.',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah stok' },
      { status: 500 }
    );
  }
}
