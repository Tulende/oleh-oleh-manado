'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerChat from '@/components/customer-chat';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  X,
  CreditCard,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Lock,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';

interface CartItem {
  productId: string;
  product: any;
  quantity: number;
  packagingChoice: 'STANDARD' | 'VACUUM_SEALED';
}

function getCategoryEmoji(category?: string) {
  if (!category) return '🛍️';
  const cat = category.toLowerCase().replace(/[-_]+/g, ' ');
  if (cat.includes('ikan') || cat.includes('cakalang') || cat.includes('fufu')) return '🐟';
  if (cat.includes('sambal') || cat.includes('roa') || cat.includes('pedas')) return '🌶️';
  if (cat.includes('kue') || cat.includes('klapper')) return '🍰';
  if (cat.includes('snack') || cat.includes('kering') || cat.includes('halua')) return '🥜';
  if (cat.includes('bumbu') || cat.includes('rempah')) return '🌿';
  return '🛍️';
}

function normalizeCategory(category?: string | null): string {
  if (!category || typeof category !== 'string') return '';
  return category
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkCategoryMatch(productCategory?: string | null, selected?: string | null): boolean {
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

  // Exact normalized match (e.g. 'olahan ikan' === 'olahan ikan')
  if (normProduct === normSelected) {
    return true;
  }

  // Separator-stripped match (e.g. 'olahanikan' === 'olahanikan')
  const alphaProduct = normProduct.replace(/\s+/g, '');
  const alphaSelected = normSelected.replace(/\s+/g, '');
  if (alphaProduct === alphaSelected) {
    return true;
  }

  // Substring match in either direction
  if (normProduct.includes(normSelected) || normSelected.includes(normProduct)) {
    return true;
  }
  if (alphaProduct.includes(alphaSelected) || alphaSelected.includes(alphaProduct)) {
    return true;
  }

  return false;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Cart & Checkout configuration
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);

  const [qty, setQty] = useState(1);
  const [packagingChoice, setPackagingChoice] = useState<'STANDARD' | 'VACUUM_SEALED'>('STANDARD');
  const [shippingAddress, setShippingAddress] = useState('Jl. Sam Ratulangi No. 45, Wenang, Manado');
  const [destinationCity, setDestinationCity] = useState('jakarta');
  const [courierFee, setCourierFee] = useState(35000);
  const [courierName, setCourierName] = useState('JNE - Reguler (2-3 hari)');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const [buyer, setBuyer] = useState<{ id: string; name: string; role: string } | null>(null);

  const showToast = (msg: string, icon = 'ℹ️') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3500);
  };

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentra_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.error('Gagal memuat keranjang dari localStorage', e);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => response.json() as Promise<any>)
      .then((data) => setBuyer(data.user?.role === 'CUSTOMER' ? data.user : null))
      .catch(() => setBuyer(null));

    fetch('/api/inventory')
      .then(async (res) => {
        const data = await res.json() as any;
        if (!res.ok || !data.success) throw new Error(data.error || 'Gagal memuat katalog produk.');
        return data;
      })
      .then((data) => {
        setProducts(data.products || []);
        setCatalogError(null);
      })
      .catch((err) => {
        console.error(err);
        setCatalogError(err instanceof Error ? err.message : 'Gagal memuat katalog produk.');
      });
  }, []);

  // Update courier fee based on city
  useEffect(() => {
    if (destinationCity === 'lokal_manado') {
      setCourierFee(15000);
      setCourierName('Kurir Lokal Instan Manado (Hari Ini)');
    } else if (destinationCity === 'makassar') {
      setCourierFee(28000);
      setCourierName('JNE - Reguler (2 hari)');
    } else {
      setCourierFee(35000);
      setCourierName('JNE - Reguler (2-3 hari)');
    }
  }, [destinationCity]);

  // Cart operations
  const addToCart = (product: any, choice: 'STANDARD' | 'VACUUM_SEALED' = 'STANDARD', count = 1) => {
    if (!product || product.stock <= 0) {
      showToast(`Stok "${product?.name || 'produk'}" habis`, '⚠️');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.productId === product.id && it.packagingChoice === choice
      );
      let updated: CartItem[];
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(product.stock, currentQty + count);
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
      } else {
        updated = [
          ...prev,
          {
            productId: product.id,
            product,
            quantity: Math.min(product.stock, count),
            packagingChoice: choice,
          },
        ];
      }
      try {
        localStorage.setItem('sentra_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(`"${product.name}" ditambahkan ke keranjang!`, '🛒');
  };

  const updateCartQty = (index: number, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        const item = prev[index];
        const updated = prev.filter((_, i) => i !== index);
        try { localStorage.setItem('sentra_cart', JSON.stringify(updated)); } catch {}
        showToast(`"${item?.product?.name || 'Item'}" dihapus dari keranjang`, '🗑️');
        return updated;
      }
      const item = prev[index];
      const maxStock = item.product?.stock || 999;
      if (newQty > maxStock) {
        showToast(`Stok tersedia hanya ${maxStock} unit`, '⚠️');
        newQty = maxStock;
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      try { localStorage.setItem('sentra_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateCartPackaging = (index: number, choice: 'STANDARD' | 'VACUUM_SEALED') => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], packagingChoice: choice };
      try { localStorage.setItem('sentra_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const item = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      try { localStorage.setItem('sentra_cart', JSON.stringify(updated)); } catch {}
      showToast(`"${item?.product?.name || 'Item'}" dihapus`, '🗑️');
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    try { localStorage.removeItem('sentra_cart'); } catch {}
    showToast('Keranjang belanja telah dikosongkan', '🧹');
  };

  // Categories
  const categories = [
    'Semua',
    'Olahan Ikan',
    'Sambal',
    'Kue Khas',
    'Snack Kering',
    'Bumbu Rempah',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = checkCategoryMatch(p.category, selectedCategory);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      ? true
      : (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleOpenCheckout = (product: any) => {
    if (!buyer) {
      window.location.href = '/login?next=%2F';
      return;
    }
    setIsCartCheckout(false);
    setSelectedProduct(product);
    setQty(1);
    setPackagingChoice(product.allowedPackaging === 'VACUUM_SEALED' ? 'VACUUM_SEALED' : 'STANDARD');
    setAppliedPromo(null);
    setPromoCodeInput('MANADOBARU20');
    setCheckoutModalOpen(true);
  };

  const handleProceedToCartCheckout = () => {
    if (cart.length === 0) return;
    if (!buyer) {
      window.location.href = '/login?next=%2F';
      return;
    }
    setIsCartCheckout(true);
    setCartDrawerOpen(false);
    setAppliedPromo(null);
    setPromoCodeInput('MANADOBARU20');
    setCheckoutModalOpen(true);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setBuyer(null);
  };

  // Calculations for Active Checkout (Cart vs Single Product)
  const totalCartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const cartSubtotal = cart.reduce((sum, it) => sum + (it.product?.price || 0) * it.quantity, 0);
  const cartPackagingFee = cart.reduce((sum, it) => {
    const fee = it.packagingChoice === 'VACUUM_SEALED' ? (it.product?.vacuumExtraFee || 5000) : 0;
    return sum + fee * it.quantity;
  }, 0);
  const cartEstimatedTotal = cartSubtotal + cartPackagingFee;

  const checkoutItems = isCartCheckout
    ? cart
    : selectedProduct
      ? [{ productId: selectedProduct.id, product: selectedProduct, quantity: qty, packagingChoice }]
      : [];

  const checkoutSubtotal = checkoutItems.reduce((sum, it) => sum + (it.product?.price || 0) * it.quantity, 0);
  const checkoutPackagingTotal = checkoutItems.reduce((sum, it) => {
    const fee = it.packagingChoice === 'VACUUM_SEALED' ? (it.product?.vacuumExtraFee || 5000) : 0;
    return sum + fee * it.quantity;
  }, 0);
  const discountAmount = appliedPromo?.discountAmount || 0;
  const grandTotal = Math.max(0, checkoutSubtotal + checkoutPackagingTotal + courierFee - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || checkoutSubtotal <= 0) return;
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: promoCodeInput.trim(),
          userId: buyer?.id,
          subtotal: checkoutSubtotal,
          shippingFee: courierFee,
        }),
      });
      const data = (await res.json()) as any;
      if (data.isValid) {
        setAppliedPromo(data.promotion);
        showToast(`Promo ${data.promotion.code} aktif! Hemat Rp ${data.promotion.discountAmount.toLocaleString('id-ID')}`, '🎉');
      } else {
        setAppliedPromo(null);
        showToast(data.error || 'Kode promo tidak valid', '⚠️');
      }
    } catch (e: any) {
      showToast(e.message, '⚠️');
    }
  };

  const handleProcessCheckout = async () => {
    if (checkoutItems.length === 0) return;
    setCheckoutLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyer?.id,
          items: checkoutItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            packagingChoice: it.packagingChoice,
          })),
          shippingCity: destinationCity,
          shippingAddress: shippingAddress.trim() || 'Jl. Sam Ratulangi No. 45, Wenang, Manado',
          courierName,
          shippingFee: courierFee,
          promoCode: appliedPromo?.code || promoCodeInput,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        showToast(data.error || 'Checkout gagal', '🛑');
        return;
      }

      showToast(`Pesanan berhasil dibuat (#${data.invoiceNumber}). Menyiapkan pembayaran Midtrans...`, '💳');

      if (isCartCheckout) {
        setCart([]);
        try {
          localStorage.removeItem('sentra_cart');
        } catch {}
      }

      setCheckoutModalOpen(false);
      window.location.assign(data.redirectUrl);
    } catch (err: any) {
      showToast(err.message, '⚠️');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-600 selection:text-white">
      
      {/* 2. MAIN NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 sm:h-20 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md">
              S
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-xl font-black tracking-tight text-stone-900 flex items-center gap-1.5 whitespace-nowrap">
                <span>SENTRA MINAHASA</span>
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              </div>
              <p className="hidden sm:block text-[11px] text-stone-500 tracking-wide font-medium">
                Pusat Oleh-Oleh & Kuliner Autentik Sulawesi Utara
              </p>
            </div>
          </Link>

          {/* Search Box */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Cakalang Fufu, Sambal Roa, Klappertaart..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>

          {/* Quick Header Features */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-600 border-r border-stone-200 pr-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garansi Fresh & Vacuum Sealed</span>
            </div>

            {/* Cart Button with Count Badge */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-stone-100 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-bold px-2.5 sm:px-3.5 py-2 rounded-full transition-all shadow-2xs group"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-4 h-4 text-orange-600 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Keranjang</span>
              {totalCartCount > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white shadow-xs">
                  {totalCartCount}
                </span>
              ) : (
                <span className="hidden sm:inline text-stone-400 font-normal">(0)</span>
              )}
            </button>

            {buyer ? (
              <button
                onClick={handleLogout}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-full transition-all shadow-sm whitespace-nowrap"
              >
                <span className="sm:hidden">Keluar</span>
                <span className="hidden sm:inline">Keluar ({buyer.name.split(' ')[0]})</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-full transition-all shadow-sm whitespace-nowrap"
              >
                <span className="sm:hidden">Masuk</span>
                <span className="hidden sm:inline">Login / Daftar</span>
              </Link>
            )}
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-500 hover:text-orange-700 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SHOWCASE SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 items-center">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Kurasi 100% Produk UMKM Sulawesi Utara</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Bawa Pulang Gurihnya Manado, Segar Sampai Rumah.
            </h1>

            <p className="text-sm text-stone-300 leading-relaxed max-w-xl">
              Nikmati kelezatan Cakalang Fufu asap tradisional Bitung, pedasnya Sambal Roa asli, manisnya Klappertaart, dan renyahnya Halua Kenari. Dilengkapi kemasan <strong>Vacuum Sealed Pack</strong> agar kualitas rasa tahan hingga 14 hari perjalanan luar pulau.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#katalog"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 py-3 rounded-full transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
              >
                <span>Mulai Belanja Oleh-Oleh</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/15 text-xs flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>Pengiriman Ekspedisi JNE, POS & Kurir Lokal</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CATEGORY SELECTOR & FILTER */}
      <section id="katalog" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-4">
        {/* Mobile Search Bar */}
        <div className="relative mb-6 max-w-md mx-auto md:hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari produk oleh-oleh..."
            aria-label="Cari produk"
            className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-orange-500 shadow-xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 my-6">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 md:px-7 md:py-3.5 text-base font-semibold rounded-full transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5. PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-6">
          {catalogError ? (
            <p className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Katalog gagal dimuat: {catalogError}
            </p>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 px-4 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-stone-200 my-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-3xl mb-3">
                📦
              </div>
              <h3 className="text-base font-bold text-stone-800">
                {selectedCategory !== 'Semua'
                  ? `Belum ada produk di kategori "${selectedCategory}"`
                  : 'Belum ada produk tersedia'}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
                {selectedCategory !== 'Semua'
                  ? 'Produk untuk kategori ini belum tersedia atau sedang disiapkan.'
                  : 'Produk sedang disiapkan. Silakan cek kembali nanti.'}
              </p>
            </div>
          ) : null}
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStockThreshold;

            return (
              <div
                key={p.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Product Visual Tag */}
                  <div className="h-44 bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4 relative border-b border-stone-100">
                    <span className="text-5xl group-hover:scale-110 transition-transform">
                      {getCategoryEmoji(p.category)}
                    </span>
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-[10px] font-bold text-stone-500 mt-2 tracking-wider uppercase">
                      {p.category}
                    </span>

                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      {isLowStock ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Sisa {p.stock} Unit
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Stok Tersedia
                        </span>
                      )}
                    </div>

                    {p.allowedPackaging === 'VACUUM_SEALED' && (
                      <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                        🛡️ Tersedia Vacuum Pack
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-mono text-stone-400">{p.sku}</span>
                    <h3 className="font-bold text-sm text-stone-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-stone-400 font-medium">Harga</div>
                      <div className="text-base font-black text-orange-600">
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addToCart(p, p.allowedPackaging === 'VACUUM_SEALED' ? 'VACUUM_SEALED' : 'STANDARD', 1)}
                        disabled={p.stock <= 0}
                        title="Tambah ke Keranjang"
                        className="p-2 rounded-xl border border-stone-200 bg-stone-100 hover:bg-orange-50 hover:border-orange-300 text-stone-700 hover:text-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs group"
                      >
                        <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(p)}
                        disabled={p.stock <= 0}
                        className="bg-stone-900 hover:bg-orange-600 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>{p.stock <= 0 ? 'Habis' : 'Beli Langsung'}</span>
                        {p.stock > 0 && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. VISUAL REVIEW SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <span className="font-black text-lg text-stone-900">4.9 / 5.0</span>
                <span className="text-xs text-stone-500">(150+ Ulasan Pembeli Nyata)</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">Ulasan Visual dari Pelanggan di Seluruh Indonesia</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              ✓ Semua Ulasan dari Pembeli Terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">Regina Paat</span>
                <span className="text-[10px] text-stone-400">Jakarta Selatan</span>
              </div>
              <div className="flex text-amber-500 text-xs">★★★★★</div>
              <p className="text-stone-600 leading-relaxed">
                &quot;Ikan cakalang fufu asapnya wangi sekali! Dagingnya tebal dan tidak amis. Pake kemasan vacuum sealed sampai di Jakarta tetap segar dan aromanya tidak tembus ke luar.&quot;
              </p>
              <div className="pt-1 flex gap-2">
                <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded">
                  📷 Kemasan Vacuum Rapat
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">David Wenas</span>
                <span className="text-[10px] text-stone-400">Surabaya</span>
              </div>
              <div className="flex text-amber-500 text-xs">★★★★★</div>
              <p className="text-stone-600 leading-relaxed">
                &quot;Sambal roa asli mantap pedasnya pas ikan roanya beneran melimpah bukan cuma minyak dan cabai. Sangat recommended buat pecinta kuliner pedas Manado!&quot;
              </p>
              <div className="pt-1 flex gap-2">
                <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded">
                  📷 Segel Botol Utuh
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">Fernando Mandagi</span>
                <span className="text-[10px] text-stone-400">Bandung</span>
              </div>
              <div className="flex text-amber-500 text-xs">★★★★★</div>
              <p className="text-stone-600 leading-relaxed">
                &quot;Halua kenarinya renyah dan gula arennya wangi sekali. Pengiriman cepat via JNE dan respon CS toko sangat ramah. Bakal langganan terus.&quot;
              </p>
              <div className="pt-1 flex gap-2">
                <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded">
                  📷 Foto Produk Diterima
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SHOPPING CART SLIDE-OVER DRAWER */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                    <span>Keranjang Belanja</span>
                    <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      {totalCartCount} item
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500">Sentra Kuliner Sulut & Oleh-Oleh</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shadow-2xs"
                aria-label="Tutup Keranjang"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-400">
                  <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center text-4xl shadow-inner">
                    🛒
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-base">Keranjang Anda Masih Kosong</h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
                      Belum ada oleh-oleh khas Manado yang dipilih. Silakan jelajahi katalog kuliner kami!
                    </p>
                  </div>
                  <a
                    href="#katalog"
                    onClick={() => setCartDrawerOpen(false)}
                    className="mt-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Mulai Belanja</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
                    <span>Daftar item di keranjang:</span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kosongkan</span>
                    </button>
                  </div>

                  {cart.map((item, index) => {
                    const unitPrice = item.product?.price || 0;
                    const vacFee = item.packagingChoice === 'VACUUM_SEALED' ? (item.product?.vacuumExtraFee || 5000) : 0;
                    const itemTotal = (unitPrice + vacFee) * item.quantity;
                    const canVacuum = item.product?.allowedPackaging === 'VACUUM_SEALED';

                    return (
                      <div
                        key={`${item.productId}-${item.packagingChoice}-${index}`}
                        className="p-3.5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-2.5 transition-all hover:border-orange-200"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shrink-0">
                            {getCategoryEmoji(item.product?.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{item.product?.name}</h4>
                              <button
                                type="button"
                                onClick={() => removeFromCart(index)}
                                className="text-stone-400 hover:text-red-600 p-0.5 transition-colors"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-orange-600 font-extrabold mt-0.5">
                              Rp {unitPrice.toLocaleString('id-ID')}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              SKU: {item.product?.sku}
                            </div>
                          </div>
                        </div>

                        {/* Packaging Toggle */}
                        {canVacuum && (
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                            <span className="text-stone-500 font-medium">Opsi Kemasan:</span>
                            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => updateCartPackaging(index, 'STANDARD')}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  item.packagingChoice === 'STANDARD'
                                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                    : 'text-stone-500 hover:text-stone-900'
                                }`}
                              >
                                Standar
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCartPackaging(index, 'VACUUM_SEALED')}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  item.packagingChoice === 'VACUUM_SEALED'
                                    ? 'bg-orange-600 text-white shadow-2xs font-bold'
                                    : 'text-stone-500 hover:text-stone-900'
                                }`}
                              >
                                Vacuum (+Rp 5rb)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Qty & Item Subtotal */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                          <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50">
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, item.quantity - 1)}
                              className="px-2.5 py-1 font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-l-xl transition-colors"
                              aria-label="Kurangi kuantitas"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-stone-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, item.quantity + 1)}
                              className="px-2.5 py-1 font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-r-xl transition-colors"
                              aria-label="Tambah kuantitas"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block">Subtotal</span>
                            <span className="text-xs font-black text-stone-900">
                              Rp {itemTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Produk ({totalCartCount} pcs)</span>
                    <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {cartPackagingFee > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Kemasan Khusus Vacuum</span>
                      <span>Rp {cartPackagingFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-black text-stone-900">
                    <span>Estimasi Belanja</span>
                    <span className="text-orange-600">Rp {cartEstimatedTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    * Ongkir ekspedisi & voucher promo dihitung saat checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCartCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Langsung Checkout ({totalCartCount} Item)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. CHECKOUT MODAL (SUPPORTS BOTH CART & SINGLE PRODUCT CHECKOUT) */}
      {checkoutModalOpen && (isCartCheckout ? cart.length > 0 : selectedProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  {isCartCheckout ? 'Checkout Keranjang Belanja' : 'Ringkasan Pesanan'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isCartCheckout
                    ? `Memproses ${checkoutItems.length} produk pilihan dari keranjang`
                    : 'Konfirmasi detail kemasan & pengiriman Anda'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Cart Checkout: List of cart items */}
            {isCartCheckout ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Daftar Pesanan ({checkoutItems.length} jenis produk):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setCartDrawerOpen(true);
                    }}
                    className="text-orange-600 hover:text-orange-700 font-semibold text-[11px] underline decoration-dotted"
                  >
                    Edit Keranjang
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {checkoutItems.map((it, idx) => {
                    const itemVacFee = it.packagingChoice === 'VACUUM_SEALED' ? (it.product?.vacuumExtraFee || 5000) : 0;
                    const itemSub = ((it.product?.price || 0) + itemVacFee) * it.quantity;
                    return (
                      <div
                        key={`${it.productId}-${idx}`}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{getCategoryEmoji(it.product?.category)}</span>
                          <div className="truncate">
                            <div className="font-bold text-stone-900 truncate">{it.product?.name}</div>
                            <div className="text-[11px] text-stone-500">
                              {it.quantity} pcs &bull; Rp {(it.product?.price || 0).toLocaleString('id-ID')}
                              {it.packagingChoice === 'VACUUM_SEALED' && (
                                <span className="ml-1 text-orange-600 font-semibold">(Vacuum Pack)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="font-extrabold text-stone-900 shrink-0">
                          Rp {itemSub.toLocaleString('id-ID')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Selected Product Card */
              <>
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex gap-3.5 items-center">
                  <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
                    {getCategoryEmoji(selectedProduct.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-stone-900">{selectedProduct.name}</h4>
                    <div className="text-[11px] text-stone-500">
                      Rp {selectedProduct.price.toLocaleString('id-ID')} / pack
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      ✓ Stok Tersedia di Gudang Sentra: {selectedProduct.stock} unit
                    </div>
                  </div>
                </div>

                {/* Packaging Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 block">
                    Pilih Opsi Kemasan Khusus:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPackagingChoice('STANDARD')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        packagingChoice === 'STANDARD'
                          ? 'border-orange-500 bg-orange-50/50 font-bold shadow-xs'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="font-bold text-stone-900">Standar</div>
                      <div className="text-[10px] text-stone-500">Tahan 3-4 hari (+Rp 0)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPackagingChoice('VACUUM_SEALED')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        packagingChoice === 'VACUUM_SEALED'
                          ? 'border-orange-500 bg-orange-50/50 font-bold shadow-xs'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="font-bold text-stone-900">Vacuum Sealed Pack</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Tahan 14 hari (+Rp {selectedProduct.vacuumExtraFee?.toLocaleString('id-ID') || '5.000'})</div>
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="font-bold text-stone-800">Jumlah Pesanan:</span>
                  <div className="flex items-center border border-stone-300 rounded-xl bg-white">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="px-3 py-1 font-bold text-stone-500 hover:text-stone-900"
                    >
                      -
                    </button>
                    <span className="px-3 font-bold text-stone-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(Math.min(selectedProduct.stock || 999, qty + 1))}
                      className="px-3 py-1 font-bold text-stone-500 hover:text-stone-900"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Shipping Destination */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Kota Tujuan Ekspedisi:</label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
              >
                <option value="lokal_manado">Manado & Sekitarnya (Kurir Lokal Instan - Rp 15.000)</option>
                <option value="makassar">Makassar (RajaOngkir JNE - Rp 28.000)</option>
                <option value="jakarta">Jakarta & Jabodetabek (RajaOngkir JNE - Rp 35.000)</option>
                <option value="surabaya">Surabaya / Jawa Timur (RajaOngkir JNE - Rp 35.000)</option>
              </select>
            </div>

            {/* Shipping Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Alamat Lengkap Pengiriman:</label>
              <textarea
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Contoh: Jl. Sam Ratulangi No. 45, RT 02/RW 03, Wenang, Manado"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Voucher Promo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Kode Promo / Voucher:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="KODE PROMO"
                  className="flex-1 uppercase font-mono text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {appliedPromo && (
                <div className="text-[11px] text-emerald-700 font-medium">
                  ✓ Voucher {appliedPromo.code} berhasil memotong Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 pt-3 border-t border-stone-200 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal Produk ({checkoutItems.reduce((s, it) => s + it.quantity, 0)} pcs)</span>
                <span>Rp {checkoutSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Biaya Kemasan Vacuum</span>
                <span>Rp {checkoutPackagingTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Ongkos Kirim ({courierName.split(' ')[0]})</span>
                <span>Rp {courierFee.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Diskon Promo</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-stone-200 text-base font-black text-stone-900">
                <span>Total Pembayaran</span>
                <span className="text-orange-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={handleProcessCheckout}
              disabled={checkoutLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
            >
              <CreditCard className="w-4 h-4" />
              <span>{checkoutLoading ? 'Memproses Pesanan...' : 'Bayar Sekarang via Midtrans'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pembayaran Aman Terenkripsi SSL & Midtrans Gateway</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button for Quick Access */}
      {totalCartCount > 0 && !cartDrawerOpen && !checkoutModalOpen && (
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-4 left-3 right-20 sm:bottom-6 sm:left-6 sm:right-auto z-40 bg-stone-900 hover:bg-orange-600 text-white font-bold text-[11px] sm:text-xs px-4 py-3 rounded-full shadow-2xl flex items-center justify-center sm:justify-start gap-3 transition-all border border-stone-700 hover:scale-105 active:scale-95 group"
          aria-label="Buka Keranjang Belanja"
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 text-orange-400 group-hover:text-white transition-colors" />
            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-orange-600 text-[9px] font-black flex items-center justify-center text-white">
              {totalCartCount}
            </span>
          </div>
          <span className="truncate">Keranjang: Rp {cartEstimatedTotal.toLocaleString('id-ID')}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
        </button>
      )}

      {/* 8. FOOTER */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-12 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-black text-base">
              <span className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white text-sm">S</span>
              <span>SENTRA MINAHASA</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-md">
              Marketplace resmi sentra oleh-oleh kuliner khas Sulawesi Utara. Mendukung digitalisasi ratusan pelaku UMKM kuliner di Manado, Bitung, Minahasa, Tomohon, dan kepulauan Sitaro.
            </p>
            <div className="text-[11px] text-stone-500">
              Alamat Sentra: Jl. Sam Ratulangi No. 45, Wenang, Kota Manado, Sulawesi Utara 95111
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Layanan Konsumen</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li>Pilihan Kemasan Vacuum</li>
              <li>Cek Ongkos Kirim Ekspedisi</li>
              <li>Syarat & Ketentuan Pengiriman</li>
              <li>Konfirmasi Pembayaran Midtrans</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Akses Manajemen</h4>
            <p className="text-stone-400 text-[11px]">
              Dosen penguji & tim UMKM dapat memantau pergerakan stok dan metrik CRM di panel internal:
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all mt-2"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Buka Dashboard Admin & CRM</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-stone-800 text-center text-stone-500 text-[11px]">
          &copy; {new Date().getFullYear()} Sentra Minahasa • Tugas Akhir Sistem E-Commerce Full-Stack Berbasis Cloudflare & Midtrans.
        </div>
      </footer>

      <CustomerChat />

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50 max-w-lg bg-stone-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2 border border-stone-700">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
