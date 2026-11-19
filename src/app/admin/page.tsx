'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Send,
  RefreshCw,
  ShoppingBag,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  minStockThreshold: number;
  weightInGrams: number;
  isPerishable: boolean;
  shelfLifeDays: number;
  allowedPackaging: string;
  vacuumExtraFee: number;
  imageUrl?: string | null;
}

const CATEGORIES = ['Olahan Ikan', 'Sambal', 'Kue Khas', 'Snack Kering', 'Bumbu Rempah'];
const PACKAGING_OPTIONS = ['STANDARD', 'VACUUM_SEALED'];

const EMPTY_FORM: Omit<Product, 'id'> = {
  sku: '',
  name: '',
  slug: '',
  description: '',
  category: 'Olahan Ikan',
  price: 0,
  stock: 0,
  minStockThreshold: 5,
  weightInGrams: 500,
  isPerishable: false,
  shelfLifeDays: 7,
  allowedPackaging: 'STANDARD',
  vacuumExtraFee: 0,
  imageUrl: '',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Product Form Modal ────────────────────────────────────────────────────

function ProductFormModal({
  mode,
  initial,
  onClose,
  onSaved,
  showToast,
}: {
  mode: 'add' | 'edit';
  initial: Omit<Product, 'id'> & { id?: string };
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, icon?: string) => void;
}) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'name' && mode === 'add') {
        updated.slug = slugify(value);
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = 'SKU wajib diisi';
    if (!form.name.trim()) e.name = 'Nama produk wajib diisi';
    if (!form.slug.trim()) e.slug = 'Slug wajib diisi';
    if (!form.description.trim()) e.description = 'Deskripsi wajib diisi';
    if (!form.category) e.category = 'Kategori wajib dipilih';
    if (!form.price || form.price <= 0) e.price = 'Harga harus > 0';
    if (form.stock < 0) e.stock = 'Stok tidak boleh negatif';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        minStockThreshold: Number(form.minStockThreshold),
        weightInGrams: Number(form.weightInGrams),
        shelfLifeDays: Number(form.shelfLifeDays),
        vacuumExtraFee: Number(form.vacuumExtraFee),
        imageUrl: form.imageUrl?.trim() || null,
      };

      let res: Response;
      if (mode === 'add') {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/products/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json() as any;
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan produk', '❌');
        return;
      }
      showToast(mode === 'add' ? `Produk "${form.name}" berhasil ditambahkan!` : `Produk "${form.name}" berhasil diperbarui!`, '✅');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Kesalahan jaringan', '❌');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label, name, type = 'text', required = false, children, hint,
  }: {
    label: string; name: string; type?: string; required?: boolean; children: React.ReactNode; hint?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-stone-300 flex items-center gap-1">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {errors[name] && <p className="text-[10px] text-red-400">{errors[name]}</p>}
      {hint && !errors[name] && <p className="text-[10px] text-stone-500">{hint}</p>}
    </div>
  );

  const inputCls = (name: string) =>
    `w-full bg-stone-900 border ${errors[name] ? 'border-red-500' : 'border-stone-700'} rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto p-4">
      <div className="bg-stone-950 border border-stone-800 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-stone-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-500" />
            {mode === 'add' ? 'Tambah Produk Baru' : `Edit Produk: ${initial.name}`}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SKU" name="sku" required hint="Contoh: MN-CKL-001">
              <input
                className={inputCls('sku')}
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="MN-XXX-000"
                disabled={mode === 'edit'}
              />
            </Field>
            <Field label="Kategori" name="category" required>
              <select
                className={inputCls('category')}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 2 */}
          <Field label="Nama Produk" name="name" required>
            <input
              className={inputCls('name')}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Cakalang Fufu Asap Tradisional Bitung (500g)"
            />
          </Field>

          <Field label="Slug URL" name="slug" required hint="Hanya huruf kecil, angka, dan tanda hubung (-). Auto-generate dari nama.">
            <input
              className={inputCls('slug')}
              value={form.slug}
              onChange={(e) => set('slug', slugify(e.target.value))}
              placeholder="cakalang-fufu-asap-500g"
            />
          </Field>

          <Field label="Deskripsi" name="description" required>
            <textarea
              className={`${inputCls('description')} h-20 resize-none`}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Deskripsi produk…"
            />
          </Field>

          {/* Row 3 – Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Harga (Rp)" name="price" required>
              <input
                type="number" min={0} className={inputCls('price')}
                value={form.price} onChange={(e) => set('price', e.target.value)}
              />
            </Field>
            <Field label="Stok (unit)" name="stock">
              <input
                type="number" min={0} className={inputCls('stock')}
                value={form.stock} onChange={(e) => set('stock', e.target.value)}
              />
            </Field>
            <Field label="Min Stok Alert" name="minStockThreshold">
              <input
                type="number" min={0} className={inputCls('minStockThreshold')}
                value={form.minStockThreshold} onChange={(e) => set('minStockThreshold', e.target.value)}
              />
            </Field>
            <Field label="Berat (gram)" name="weightInGrams">
              <input
                type="number" min={0} className={inputCls('weightInGrams')}
                value={form.weightInGrams} onChange={(e) => set('weightInGrams', e.target.value)}
              />
            </Field>
          </div>

          {/* Row 4 – Packaging & Perishable */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Kemasan" name="allowedPackaging">
              <select
                className={inputCls('allowedPackaging')}
                value={form.allowedPackaging}
                onChange={(e) => set('allowedPackaging', e.target.value)}
              >
                {PACKAGING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Biaya Vacuum (Rp)" name="vacuumExtraFee">
              <input
                type="number" min={0} className={inputCls('vacuumExtraFee')}
                value={form.vacuumExtraFee} onChange={(e) => set('vacuumExtraFee', e.target.value)}
              />
            </Field>
            <Field label="Masa Simpan (hari)" name="shelfLifeDays">
              <input
                type="number" min={1} className={inputCls('shelfLifeDays')}
                value={form.shelfLifeDays} onChange={(e) => set('shelfLifeDays', e.target.value)}
              />
            </Field>
            <Field label="Produk Mudah Rusak?" name="isPerishable">
              <select
                className={inputCls('isPerishable')}
                value={form.isPerishable ? 'true' : 'false'}
                onChange={(e) => set('isPerishable', e.target.value === 'true')}
              >
                <option value="false">Tidak</option>
                <option value="true">Ya</option>
              </select>
            </Field>
          </div>

          {/* Image URL */}
          <Field label="URL Foto Produk" name="imageUrl" hint="Contoh: /images/products/cakalang.jpg">
            <input
              className={inputCls('imageUrl')}
              value={form.imageUrl ?? ''}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="/images/products/nama-produk.jpg"
            />
          </Field>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Menyimpan…' : mode === 'add' ? 'Simpan Produk' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'crm' | 'inventory' | 'demo'>('crm');
  const [crmData, setCrmData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);

  // Inventory CRUD states
  const [productModal, setProductModal] = useState<{
    open: boolean; mode: 'add' | 'edit'; product?: Product;
  }>({ open: false, mode: 'add' });
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Demo Runner states
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [lastInvoice, setLastInvoice] = useState<string>('');

  const showToast = (msg: string, icon = 'ℹ️') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 4000);
  };

  const addDemoLog = (msg: string) => {
    setDemoLog((prev) => [
      `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`,
      ...prev,
    ]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, crmRes] = await Promise.all([
        fetch('/api/inventory').then((r) => r.json() as Promise<any>),
        fetch('/api/crm').then((r) => r.json() as Promise<any>),
      ]);
      if (invRes.success) setInventoryData(invRes);
      if (crmRes.success) setCrmData(crmRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── CRM Action ──
  const handleTriggerRetention = async (segment = 'CHURN_RISK', percent = 25) => {
    addDemoLog(`[CRM ACTION] Mengirim voucher retensi ${percent}% otomatis ke seluruh pelanggan segmen "${segment}"...`);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSegment: segment, discountPercent: percent }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        showToast(data.message, '🚀');
        addDemoLog(`[BERHASIL] Voucher ${data.promo.code} aktif dan didistribusikan ke ${data.targetedUserCount} pelanggan.`);
        await fetchData();
      }
    } catch (err: any) {
      showToast(err.message, '⚠️');
    }
  };

  // ── Demo Checkout ──
  const handleDemoCheckout = async (forceOver = false) => {
    const product = inventoryData?.products?.[0];
    const buyer = crmData?.crm?.topCustomers?.[0];
    const qtyToBuy = forceOver ? 9999 : 2;

    addDemoLog(`[DEMO CHECKOUT] Mencoba checkout "${product?.name}" sebanyak ${qtyToBuy} unit...`);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyer?.id,
          items: [{ productId: product?.id, quantity: qtyToBuy, packagingChoice: 'VACUUM_SEALED' }],
          shippingCity: 'jakarta',
          courierName: 'JNE - REG',
          shippingFee: 35000,
          promoCode: 'MANADOBARU20',
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        showToast(data.error || 'Checkout ditolak server', '🛑');
        addDemoLog(`[ANTI-OVERSELLING REJECTED] Server menolak checkout dengan status 422: "${data.error}"`);
        return;
      }

      setLastInvoice(data.invoiceNumber);
      showToast(`Pesanan #${data.invoiceNumber} berhasil dibuat (Status: PENDING_PAYMENT)`, '💳');
      addDemoLog(`[CHECKOUT OK] Pesanan #${data.invoiceNumber} diterbitkan. Menunggu settlement webhook (stok DB belum berkurang).`);
    } catch (err: any) {
      showToast(err.message, '⚠️');
    }
  };

  const handleDemoWebhook = () => {
    if (!lastInvoice) {
      showToast('Jalankan langkah Checkout terlebih dahulu', '⚠️');
      return;
    }
    showToast('Settlement akan diproses otomatis setelah Midtrans mengirim notifikasi pembayaran.', '💳');
    addDemoLog(`[WEBHOOK MIDTRANS] Menunggu notifikasi bertanda tangan resmi dari Midtrans untuk #${lastInvoice}.`);
  };

  // ── Delete Product ──
  const handleDeleteProduct = async (product: Product) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json() as any;
      if (!res.ok) {
        showToast(data.error || 'Gagal menghapus produk', '❌');
        return;
      }
      showToast(`Produk "${product.name}" berhasil dihapus.`, '🗑️');
      setDeleteConfirm(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message, '❌');
    } finally {
      setDeleting(false);
    }
  };

  const products: Product[] = inventoryData?.products ?? [];
  const totalSku = products.length;
  const totalStok = products.reduce((s: number, p: Product) => s + p.stock, 0);
  const lowStockCount = inventoryData?.lowStockCount ?? 0;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans">

      {/* Product Form Modal */}
      {productModal.open && (
        <ProductFormModal
          mode={productModal.mode}
          initial={
            productModal.mode === 'edit' && productModal.product
              ? productModal.product
              : { ...EMPTY_FORM }
          }
          onClose={() => setProductModal({ open: false, mode: 'add' })}
          onSaved={fetchData}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-stone-950 border border-red-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-300">Konfirmasi Hapus Produk</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Anda akan menghapus produk <strong className="text-white">"{deleteConfirm.name}"</strong> (SKU: {deleteConfirm.sku}) secara permanen dari database. Tindakan ini tidak dapat diurungkan.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Menghapus…' : 'Ya, Hapus Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-stone-950 border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-col gap-2 2xl:h-16 2xl:flex-row 2xl:items-center 2xl:justify-between 2xl:py-0">
          <div className="flex min-w-0 items-center justify-between gap-3 2xl:flex-1">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="text-stone-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Kembali ke Toko</span>
              </Link>
              <div className="hidden sm:block h-4 w-px bg-stone-700"></div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-black text-xs sm:text-sm tracking-tight text-orange-500">ADMIN SENTRA SULUT</span>
                <span className="hidden md:inline text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono whitespace-nowrap">
                  Command Center UMKM
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.assign('/admin/login');
              }}
              className="shrink-0 rounded-lg border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-300 hover:border-orange-500 hover:text-white"
            >
              Keluar
            </button>
          </div>

          {/* Tab Navigation */}
          <nav aria-label="Navigasi admin" className="w-full max-w-full overflow-x-auto 2xl:w-auto 2xl:shrink-0">
            <div className="flex w-max min-w-full items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs 2xl:min-w-0">
              <button
                onClick={() => setActiveTab('crm')}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'crm' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CRM &amp; Retensi</span>
                <span className="sm:hidden">CRM</span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'inventory' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inventori &amp; Stok</span>
                <span className="sm:hidden">Stok</span>
                {lowStockCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {lowStockCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('demo')}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'demo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Live Scenario Assessment</span>
                <span className="sm:hidden">Demo</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">

        {/* ══ TAB 1: CRM ══════════════════════════════════════════════════════ */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-800">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span className="min-w-0 break-words">Modul CRM &amp; Customer Retention (Bobot 10%)</span>
                </h1>
                <p className="text-xs text-stone-400">
                  Perhitungan segmentasi RFM otomatis, rasio repeat purchase, dan aksi retensi voucher khusus.
                </p>
              </div>

              <button
                onClick={() => handleTriggerRetention('CHURN_RISK', 25)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Voucher Retensi 25% ke Segmen Churn Risk</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total Pelanggan Terdaftar</span>
                <div className="text-2xl font-black text-white">
                  {crmData ? (crmData.crm?.metrics?.totalCustomers ?? 0) : loading ? '…' : 0} User
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Akun dengan role CUSTOMER</span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Repeat Purchase Rate (%)</span>
                <div className="text-2xl font-black text-orange-500">
                  {crmData ? (crmData.crm?.metrics?.repeatPurchaseRatePercent ?? 0) : loading ? '…' : 0}%
                </div>
                <span className="text-[10px] text-stone-400">
                  {crmData?.crm?.metrics?.repeatBuyersCount ?? 0} dari {crmData?.crm?.metrics?.activeBuyersCount ?? 0} pelanggan yang pernah bertransaksi
                </span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Average Order Value (AOV)</span>
                <div className="text-2xl font-black text-white">
                  Rp {(crmData?.crm?.metrics?.averageOrderValue ?? 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Dari {crmData?.crm?.metrics?.totalOrdersCount ?? 0} transaksi lunas</span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total Omzet Penjualan</span>
                <div className="text-2xl font-black text-emerald-400">
                  Rp {(crmData?.crm?.metrics?.totalRevenue ?? 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-stone-400">Settlement Midtrans</span>
              </div>
            </div>

            {/* Segment Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-950/20 border border-blue-900/60 p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-300">Pelanggan Baru (NEW)</span>
                  <span className="text-xs font-black bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">
                    {crmData?.crm?.segmentDistribution?.NEW_CUSTOMER ?? 0} Pelanggan
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Pesanan pertama kali atau baru terdaftar dalam 30 hari. Diberi promo sambutan.
                </p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/60 p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-300">Pelanggan Loyal (LOYAL)</span>
                  <span className="text-xs font-black bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full">
                    {crmData?.crm?.segmentDistribution?.LOYAL ?? 0} Pelanggan
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Order &ge; 3 kali dan akumulasi belanja &ge; Rp 500.000. Diberi gratis ongkir.
                </p>
              </div>

              <div className="bg-rose-950/20 border border-rose-900/60 p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-300">Tidak Aktif (CHURN RISK)</span>
                  <span className="text-xs font-black bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full">
                    {crmData?.crm?.segmentDistribution?.CHURN_RISK ?? 0} Pelanggan
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Tidak ada transaksi baru dalam 45 hari terakhir. Target utama kampanye retensi.
                </p>
              </div>
            </div>

            {/* Customer Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Data Profil Pelanggan &amp; Riwayat Transaksi (Database Live)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400">
                      <th className="py-2 px-3">Nama</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Frekuensi</th>
                      <th className="py-2 px-3">Total Belanja</th>
                      <th className="py-2 px-3">Order Terakhir</th>
                      <th className="py-2 px-3">Segmen CRM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {crmData?.crm?.topCustomers?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-stone-900/50">
                        <td className="py-2.5 px-3 font-semibold text-white">{u.name}</td>
                        <td className="py-2.5 px-3 text-stone-400">{u.email}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-200">{u.orderCount}x</td>
                        <td className="py-2.5 px-3 font-medium text-emerald-400">
                          Rp {u.totalSpent.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-stone-400">
                          {u.lastOrderAt ? new Date(u.lastOrderAt).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            u.crmSegment === 'LOYAL'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : u.crmSegment === 'CHURN_RISK'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}>
                            {u.crmSegment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: INVENTORY ════════════════════════════════════════════════ */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-800">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span className="min-w-0 break-words">Manajemen Inventori &amp; Produk (D1 Database)</span>
                </h1>
                <p className="text-xs text-stone-400">
                  CRUD produk langsung ke Cloudflare D1. Perubahan langsung muncul di halaman katalog toko.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setProductModal({ open: true, mode: 'add' })}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>
            </div>

            {/* Summary Cards – from live DB */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total SKU Terdaftar</span>
                <div className="text-3xl font-black text-white">{totalSku}</div>
                <span className="text-[10px] text-stone-500">Dari tabel Product di D1</span>
              </div>
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total Unit Stok Tersedia</span>
                <div className="text-3xl font-black text-emerald-400">{totalStok.toLocaleString('id-ID')}</div>
                <span className="text-[10px] text-stone-500">Jumlah seluruh unit aktif</span>
              </div>
              <div className={`border rounded-2xl p-5 space-y-1 ${
                lowStockCount > 0 ? 'bg-red-950/30 border-red-800' : 'bg-stone-950 border-stone-800'
              }`}>
                <span className="text-[11px] text-stone-400 font-medium">Produk Stok Menipis</span>
                <div className={`text-3xl font-black ${lowStockCount > 0 ? 'text-red-400' : 'text-stone-400'}`}>
                  {lowStockCount}
                </div>
                <span className="text-[10px] text-stone-500">Stok ≤ minStockThreshold</span>
              </div>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
              <div className="bg-red-950/30 border border-red-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-300">
                    Peringatan Stok Menipis Aktif ({lowStockCount} Produk)
                  </h4>
                  <p className="text-[11px] text-red-400 mt-0.5">
                    Produk di bawah ini mencapai batas minimum stok (≤ threshold) dan membutuhkan restock:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inventoryData.lowStockItems.map((item: any) => (
                      <span
                        key={item.id}
                        className="text-[10px] bg-red-900/60 text-red-200 font-mono px-2 py-0.5 rounded border border-red-700"
                      >
                        {item.name}: Sisa {item.stock} unit (Batas: {item.minStockThreshold})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Product Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Daftar Produk dari Database D1 ({totalSku} SKU)
                </h3>
              </div>

              {totalSku === 0 && !loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center text-2xl">📦</div>
                  <p className="text-sm font-bold text-stone-300">Belum ada data produk.</p>
                  <p className="text-xs text-stone-500">Silakan tambahkan produk pertama Anda menggunakan tombol "Tambah Produk Baru" di atas.</p>
                  <button
                    onClick={() => setProductModal({ open: true, mode: 'add' })}
                    className="mt-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Produk Pertama
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 text-stone-400">
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3">Harga</th>
                        <th className="py-2 px-3">Stok DB</th>
                        <th className="py-2 px-3">Threshold</th>
                        <th className="py-2 px-3">Kemasan</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {products.map((p: Product) => {
                        const isLow = p.stock <= p.minStockThreshold;
                        return (
                          <tr key={p.id} className={isLow ? 'bg-red-950/20' : ''}>
                            <td className="py-2.5 px-3 font-semibold text-white max-w-[200px]">
                              <div className="truncate" title={p.name}>{p.name}</div>
                              {p.imageUrl && (
                                <div className="text-[9px] text-stone-500 font-normal truncate">{p.imageUrl}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-stone-400 whitespace-nowrap">{p.sku}</td>
                            <td className="py-2.5 px-3 text-stone-300 whitespace-nowrap">{p.category}</td>
                            <td className="py-2.5 px-3 font-medium text-orange-400 whitespace-nowrap">
                              Rp {p.price.toLocaleString('id-ID')}
                            </td>
                            <td className={`py-2.5 px-3 font-black ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                              {p.stock} unit
                            </td>
                            <td className="py-2.5 px-3 text-stone-400">{p.minStockThreshold}</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                                p.allowedPackaging === 'VACUUM_SEALED'
                                  ? 'bg-orange-950 text-orange-300 border border-orange-800'
                                  : 'bg-stone-800 text-stone-400'
                              }`}>
                                {p.allowedPackaging}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isLow ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                                  ⚠️ Menipis
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  Aman
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setProductModal({ open: true, mode: 'edit', product: p })}
                                  title="Edit Produk"
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-orange-400 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(p)}
                                  title="Hapus Produk"
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900 text-stone-300 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit Log Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Log Pergerakan Stok (Audit Log Masuk, Keluar, dan Penyesuaian)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3">Tipe</th>
                      <th className="py-2 px-3">Mutasi</th>
                      <th className="py-2 px-3">Sebelum → Sesudah</th>
                      <th className="py-2 px-3">Alasan / Catatan Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {inventoryData?.recentLogs?.length > 0 ? (
                      inventoryData.recentLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="py-2 px-3 text-stone-400">
                            {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                          </td>
                          <td className="py-2 px-3 font-sans text-stone-200">{log.product?.name}</td>
                          <td className="py-2 px-3">
                            <span className="text-[9px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">
                              {log.type}
                            </span>
                          </td>
                          <td className={`py-2 px-3 font-bold ${log.quantityChange < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                          </td>
                          <td className="py-2 px-3 text-stone-400">
                            {log.stockBefore} → {log.stockAfter}
                          </td>
                          <td className="py-2 px-3 font-sans text-stone-400">{log.reason}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-500 font-sans">
                          Belum ada log pergerakan stok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3: DEMO ═════════════════════════════════════════════════════ */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-stone-800">
              <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span className="min-w-0 break-words">Live Assessment Scenario Runner (Skenario Demo Ujian)</span>
              </h1>
              <p className="text-xs text-stone-400">
                Eksekusi skenario pengujian langsung untuk membuktikan integritas backend &amp; database di depan dosen penguji:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 1</span>
                <h4 className="text-xs font-bold text-white">Cek Stok &amp; Threshold Warning</h4>
                <p className="text-[11px] text-stone-400">
                  Periksa produk dengan stok ≤ batas minimum yang memicu low-stock alert.
                </p>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl text-xs font-semibold"
                >
                  Buka Tab Inventori &rarr;
                </button>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 2</span>
                <h4 className="text-xs font-bold text-white">Checkout &amp; Midtrans Token</h4>
                <p className="text-[11px] text-stone-400">
                  Terbitkan pesanan PENDING_PAYMENT. Pastikan stok di database <strong>belum berkurang</strong>.
                </p>
                <button
                  onClick={() => handleDemoCheckout(false)}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                  Jalankan Checkout Demo &rarr;
                </button>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 3</span>
                <h4 className="text-xs font-bold text-white">Webhook Settlement Callback</h4>
                <p className="text-[11px] text-stone-400">
                  Setelah pembayaran sandbox berhasil, Midtrans mengirim notifikasi resmi dan stok diperbarui otomatis.
                </p>
                <button
                  onClick={handleDemoWebhook}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Info Status Webhook &rarr;
                </button>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 4</span>
                <h4 className="text-xs font-bold text-white">Segmentasi CRM Otomatis</h4>
                <p className="text-[11px] text-stone-400">
                  Periksa rekalkulasi RFM pelanggan yang otomatis naik segmen setelah transaksi lunas.
                </p>
                <button
                  onClick={() => setActiveTab('crm')}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl text-xs font-semibold"
                >
                  Buka Tab CRM &rarr;
                </button>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 5</span>
                <h4 className="text-xs font-bold text-white">Aksi Retensi Promo Khusus</h4>
                <p className="text-[11px] text-stone-400">
                  Kirim voucher promosi retensi yang terkunci khusus hanya untuk segmen CHURN RISK.
                </p>
                <button
                  onClick={() => handleTriggerRetention('CHURN_RISK', 25)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Kirim Voucher Retensi &rarr;
                </button>
              </div>

              <div className="bg-red-950/20 border border-red-900 rounded-2xl p-4 space-y-2 md:col-span-2 lg:col-span-1">
                <span className="text-[10px] font-bold text-red-400">SKENARIO 6 (KRUSIAL)</span>
                <h4 className="text-xs font-bold text-red-300">Pengujian Anti-Overselling</h4>
                <p className="text-[11px] text-red-400">
                  Mencoba checkout 9.999 unit. Server <strong>wajib menolak</strong> dengan HTTP 422.
                </p>
                <button
                  onClick={() => handleDemoCheckout(true)}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  🚨 Uji Beli 9.999 Unit (Anti-Overselling)
                </button>
              </div>
            </div>

            {/* Terminal Console */}
            <div className="bg-black rounded-2xl p-3 sm:p-5 border border-stone-800 font-mono text-xs space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-stone-400 pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Terminal Console Log Backend &amp; Database</span>
                </div>
                <button onClick={() => setDemoLog([])} className="text-[10px] text-stone-500 hover:text-stone-300">
                  Clear
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pt-1 text-[11px]">
                {demoLog.length === 0 ? (
                  <div className="text-stone-600 italic">Klik tombol skenario pengujian di atas untuk melihat log server...</div>
                ) : (
                  demoLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('ANTI-OVERSELLING REJECTED')
                          ? 'text-red-400 font-bold break-words'
                          : log.includes('SUCCESS') || log.includes('BERHASIL')
                          ? 'text-emerald-400 font-bold break-words'
                          : log.includes('ACTION')
                          ? 'text-indigo-400 break-words'
                          : 'text-stone-300 break-words'
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50 max-w-lg bg-stone-800 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2 border border-stone-700">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
