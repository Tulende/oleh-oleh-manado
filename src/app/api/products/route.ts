import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkCategoryMatch } from '@/lib/category';
import { getRequestSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search') || searchParams.get('q');

    const allProducts = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    const isResetCategory =
      !categoryParam ||
      categoryParam === 'Semua' ||
      categoryParam.trim() === '' ||
      categoryParam.toLowerCase() === 'semua';

    const filtered = allProducts.filter((product) => {
      const matchCategory = isResetCategory ? true : checkCategoryMatch(product.category, categoryParam);
      const query = (searchParam || '').trim().toLowerCase();
      const matchSearch = !query
        ? true
        : (product.name && product.name.toLowerCase().includes(query)) ||
          (product.description && product.description.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });

    return NextResponse.json({
      success: true,
      total: filtered.length,
      category: isResetCategory ? null : categoryParam,
      products: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat produk' },
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
    const {
      sku, name, slug, description, category,
      price, stock, minStockThreshold, weightInGrams,
      isPerishable, shelfLifeDays, allowedPackaging,
      vacuumExtraFee, imageUrl,
    } = body;

    if (!sku || !name || !slug || !description || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Kolom wajib tidak lengkap: sku, name, slug, description, category, price, stock.' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        sku: String(sku).trim(),
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase().replace(/\s+/g, '-'),
        description: String(description).trim(),
        category: String(category).trim(),
        price: Number(price),
        stock: Number(stock),
        minStockThreshold: Number(minStockThreshold ?? 5),
        weightInGrams: Number(weightInGrams ?? 500),
        isPerishable: Boolean(isPerishable ?? false),
        shelfLifeDays: Number(shelfLifeDays ?? 7),
        allowedPackaging: String(allowedPackaging ?? 'STANDARD'),
        vacuumExtraFee: Number(vacuumExtraFee ?? 0),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'SKU atau Slug sudah digunakan produk lain.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat produk' },
      { status: 500 }
    );
  }
}
