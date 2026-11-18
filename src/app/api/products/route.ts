import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkCategoryMatch } from '@/lib/category';

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
