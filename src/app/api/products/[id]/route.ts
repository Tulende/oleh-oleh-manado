import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestSession } from '@/lib/auth';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getRequestSession(req);
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses admin diperlukan.' }, { status: 403 });
    }

    const { id } = params;
    const body = (await req.json()) as any;

    const allowedFields = [
      'name', 'slug', 'description', 'category', 'price',
      'stock', 'minStockThreshold', 'weightInGrams', 'isPerishable',
      'shelfLifeDays', 'allowedPackaging', 'vacuumExtraFee', 'imageUrl',
    ];

    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (['price', 'stock', 'minStockThreshold', 'weightInGrams', 'shelfLifeDays', 'vacuumExtraFee'].includes(key)) {
          data[key] = Number(body[key]);
        } else if (key === 'isPerishable') {
          data[key] = Boolean(body[key]);
        } else if (key === 'slug') {
          data[key] = String(body[key]).trim().toLowerCase().replace(/\s+/g, '-');
        } else if (key === 'imageUrl') {
          data[key] = body[key] ? String(body[key]).trim() : null;
        } else {
          data[key] = String(body[key]).trim();
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada field yang diperbarui.' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Slug sudah digunakan produk lain.' }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui produk' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getRequestSession(req);
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses admin diperlukan.' }, { status: 403 });
    }

    const { id } = params;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus produk' },
      { status: 500 }
    );
  }
}
