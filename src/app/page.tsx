'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  X,
  CreditCard,
  ChevronRight,
  Sparkles,
  PhoneCall,
  MapPin,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function StorefrontPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Cart & Checkout configuration
  const [qty, setQty] = useState(1);
  const [packagingChoice, setPackagingChoice] = useState<'STANDARD' | 'VACUUM_SEALED'>('STANDARD');
  const [destinationCity, setDestinationCity] = useState('jakarta');
  const [courierFee, setCourierFee] = useState(35000);
  const [courierName, setCourierName] = useState('JNE - Reguler (2-3 hari)');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);

  const showToast = (msg: string, icon = 'ℹ️') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch('/api/inventory')
      .then((res) => res.json() as Promise<any>)
      .then((data) => {
        if (data.success && data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error(err));
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
    const matchesCategory = selectedCategory === 'Semua' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenCheckout = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setPackagingChoice(product.allowedPackaging === 'VACUUM_SEALED' ? 'VACUUM_SEALED' : 'STANDARD');
    setAppliedPromo(null);
    setPromoCodeInput('MANADOBARU20');
    setCheckoutModalOpen(true);
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !selectedProduct) return;
    try {
      const sub = selectedProduct.price * qty;
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: promoCodeInput.trim(),
          userId: 'dummy-guest-user-sulut', // Diisi otomatis sistem
          subtotal: sub,
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
    if (!selectedProduct) return;
    setCheckoutLoading(true);

    try {
      // Dapatkan data user demo untuk transaksi
      const crmRes = await fetch('/api/crm').then((r) => r.json() as Promise<any>);
      const buyerUser = crmRes.crm?.topCustomers?.[0];

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyerUser?.id,
          items: [
            {
              productId: selectedProduct.id,
              quantity: qty,
              packagingChoice,
            },
          ],
          shippingCity: destinationCity,
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
      
      // Buka modal simulasi pembayaran lunas Midtrans
      setTimeout(async () => {
        const confirmPay = window.confirm(
          `[Midtrans Sandbox Payment Gateway]\n\nInvoice: ${data.invoiceNumber}\nTotal: Rp ${data.grandTotal.toLocaleString('id-ID')}\nSnap Token: ${data.snapToken}\n\nKlik "OK" untuk konfirmasi simulasi pembayaran 'SETTLEMENT' (Lunas) agar stok terpotong di database!`
        );

        if (confirmPay) {
          const webhookRes = await fetch('/api/webhooks/midtrans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: data.invoiceNumber,
              status_code: '200',
              gross_amount: data.grandTotal.toString(),
              signature_key: 'mock_signature_sandbox',
              transaction_status: 'settlement',
              fraud_status: 'accept',
              payment_type: 'gopay_qris',
            }),
          });
          const webhookData = (await webhookRes.json()) as any;
          alert(`✅ PEMBAYARAN BERHASIL!\n\n${webhookData.message}\n\nStok produk telah berkurang di database & riwayat transaksi Anda telah tersimpan.`);
          setCheckoutModalOpen(false);
          // Refresh produk
          const refreshed = await fetch('/api/inventory').then((r) => r.json() as Promise<any>);
          if (refreshed.success) setProducts(refreshed.products);
        }
      }, 600);

    } catch (err: any) {
      showToast(err.message, '⚠️');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const currentPrice = selectedProduct?.price || 0;
  const currentVacFee = packagingChoice === 'VACUUM_SEALED' ? (selectedProduct?.vacuumExtraFee || 5000) : 0;
  const subtotal = currentPrice * qty;
  const packagingTotal = currentVacFee * qty;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal + packagingTotal + courierFee - discountAmount);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-600 selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              GRATIS ONGKIR
            </span>
            <span>Subsidi Ongkir Seluruh Indonesia min. belanja Rp 100.000 (Kode: <strong>ONGKIRGRATIS</strong>)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <div className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-orange-500" />
              <span>CS WhatsApp: 0812-4110-001</span>
            </div>
            <Link
              href="/admin"
              className="text-stone-300 hover:text-orange-400 font-medium flex items-center gap-1 transition-colors underline decoration-dotted"
            >
              <Lock className="w-3 h-3" />
              <span>Portal Admin & UMKM &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md">
              S
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-stone-900 flex items-center gap-1.5">
                <span>SENTRA MINAHASA</span>
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              </div>
              <p className="text-[11px] text-stone-500 tracking-wide font-medium">
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
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-600 border-r border-stone-200 pr-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garansi Fresh & Vacuum Sealed</span>
            </div>

            <Link
              href="/admin"
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Dashboard Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SHOWCASE SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
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

          {/* Hero Feature Banner Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                🐟
              </div>
              <h3 className="font-bold text-sm">Cakalang Fufu Asap</h3>
              <p className="text-xs text-stone-300">Asap tradisional sabut kelapa dari pesisir Bitung. Daging tebal & gurih.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                🌶️
              </div>
              <h3 className="font-bold text-sm">Sambal Roa Judes</h3>
              <p className="text-xs text-stone-300">Ikan roa asap melimpah, cabai rawit pedas & minyak kelapa khas Manado.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
                🥥
              </div>
              <h3 className="font-bold text-sm">Klappertaart Asli</h3>
              <p className="text-xs text-stone-300">Custard kelapa muda lembut dengan almond panggang & kayu manis harum.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                🛡️
              </div>
              <h3 className="font-bold text-sm">Kemasan Vacuum</h3>
              <p className="text-xs text-stone-300">Segel hampa udara anti-bocor aroma, aman dikirim lewat bagasi pesawat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORY SELECTOR & FILTER */}
      <section id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-stone-900">
              Katalog Kuliner & Oleh-Oleh Khas Sulut
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Diproduksi higienis langsung oleh pengrajin UMKM Manado, Bitung, Minahasa, dan Tomohon.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-orange-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 5. PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-6">
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
                      {p.category.includes('Ikan') ? '🐟' : p.category.includes('Sambal') ? '🌶️' : p.category.includes('Kue') ? '🥧' : '🥜'}
                    </span>
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
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-stone-400 font-medium">Harga</div>
                      <div className="text-base font-black text-orange-600">
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCheckout(p)}
                      className="bg-stone-900 hover:bg-orange-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1"
                    >
                      <span>Beli</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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

      {/* 7. CHECKOUT SLIDE-OVER DRAWER / MODAL */}
      {checkoutModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Ringkasan Pesanan</h3>
                <p className="text-xs text-stone-500">Konfirmasi detail kemasan & pengiriman Anda</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Product Card */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex gap-3.5 items-center">
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
                {selectedProduct.category.includes('Ikan') ? '🐟' : '🌶️'}
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
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1 font-bold text-stone-500 hover:text-stone-900"
                >
                  -
                </button>
                <span className="px-3 font-bold text-stone-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1 font-bold text-stone-500 hover:text-stone-900"
                >
                  +
                </button>
              </div>
            </div>

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
                  className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800"
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
                <span>Subtotal Produk ({qty} pcs)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Biaya Kemasan Vacuum</span>
                <span>Rp {packagingTotal.toLocaleString('id-ID')}</span>
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
              onClick={handleProcessCheckout}
              disabled={checkoutLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
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

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-700">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
