/**
 * Helper untuk normalisasi dan pencocokan kategori produk
 * Mengabaikan case (case-insensitive), tanda hubung, garis bawah, dan spasi
 */
export function normalizeCategory(category?: string | null): string {
  if (!category || typeof category !== 'string') return '';
  return category
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkCategoryMatch(productCategory?: string | null, selected?: string | null): boolean {
  if (!selected || selected === 'Semua' || selected.trim() === '' || selected.toLowerCase() === 'semua') {
    return true;
  }
  if (!productCategory || typeof productCategory !== 'string') {
    return false;
  }

  // Exact case-insensitive trimmed match
  if (productCategory.trim().toLowerCase() === selected.trim().toLowerCase()) {
    return true;
  }

  const normProduct = normalizeCategory(productCategory);
  const normSelected = normalizeCategory(selected);

  if (!normSelected || normSelected === 'semua') {
    return true;
  }

  // Pencocokan langsung hasil normalisasi (misal: "olahan ikan" === "olahan ikan")
  if (normProduct === normSelected) {
    return true;
  }

  // Pencocokan tanpa spasi sama sekali (misal: "olahanikan" === "olahanikan")
  const alphaProduct = normProduct.replace(/\s+/g, '');
  const alphaSelected = normSelected.replace(/\s+/g, '');
  if (alphaProduct === alphaSelected) {
    return true;
  }

  // Pencocokan substring dua arah
  if (normProduct.includes(normSelected) || normSelected.includes(normProduct)) {
    return true;
  }
  if (alphaProduct.includes(alphaSelected) || alphaSelected.includes(alphaProduct)) {
    return true;
  }

  return false;
}
