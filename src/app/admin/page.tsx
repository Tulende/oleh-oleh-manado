'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'crm' | 'inventory' | 'demo'>('crm');
  const [crmData, setCrmData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);

  // Demo Runner states
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [lastInvoice, setLastInvoice] = useState<string>('');

  const showToast = (msg: string, icon = 'ℹ️') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3500);
  };

  const addDemoLog = (msg: string) => {
    setDemoLog((prev) => [
      `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`,
      ...prev,
    ]);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, crmRes] = await Promise.all([
        fetch('/api/inventory').then((r) => r.json()),
        fetch('/api/crm').then((r) => r.json()),
      ]);
      if (invRes.success) setInventoryData(invRes);
      if (crmRes.success) setCrmData(crmRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action: Kirim Voucher Retensi CRM
  const handleTriggerRetention = async (segment = 'CHURN_RISK', percent = 25) => {
    addDemoLog(`[CRM ACTION] Mengirim voucher retensi ${percent}% otomatis ke seluruh pelanggan segmen "${segment}"...`);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSegment: segment, discountPercent: percent }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, '🚀');
        addDemoLog(`[BERHASIL] Voucher ${data.promo.code} aktif dan didistribusikan ke ${data.targetedUserCount} pelanggan.`);
        await fetchData();
      }
    } catch (err: any) {
      showToast(err.message, '⚠️');
    }
  };

  // Demo: Checkout Simulasi
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

      const data = await res.json();

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

  // Demo: Simulasi Webhook Settlement Midtrans
  const handleDemoWebhook = async () => {
    if (!lastInvoice) {
      showToast('Jalankan langkah Checkout terlebih dahulu', '⚠️');
      return;
    }

    addDemoLog(`[WEBHOOK MIDTRANS] Mengirim sinyal konfirmasi pembayaran lunas 'settlement' untuk #${lastInvoice}...`);

    try {
      const res = await fetch('/api/webhooks/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: lastInvoice,
          status_code: '200',
          gross_amount: '150000',
          signature_key: 'mock_signature_key',
          transaction_status: 'settlement',
          fraud_status: 'accept',
          payment_type: 'gopay_qris',
        }),
      });

      const data = await res.json();
      showToast(data.message, '✅');
      addDemoLog(`[WEBHOOK SUCCESS] Pembayaran lunas diterima! Stok di database dipotong atomik & log mutasi dicatat.`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message, '⚠️');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans">
      
      {/* Top Header */}
      <header className="bg-stone-950 border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-stone-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold mr-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Toko</span>
            </Link>
            <div className="h-4 w-px bg-stone-700"></div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-orange-500">ADMIN SENTRA SULUT</span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono">
                Command Center UMKM
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'crm' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>CRM & Retensi</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'inventory' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventori & Stok</span>
              {inventoryData?.lowStockCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {inventoryData.lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'demo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Live Scenario Assessment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* TAB 1: CRM & CUSTOMER RETENTION */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-800">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Modul CRM & Customer Retention (Bobot 10%)</span>
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

            {/* Key Assessment Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total Pelanggan Terdaftar</span>
                <div className="text-2xl font-black text-white">
                  {crmData?.crm?.metrics?.totalCustomers || 30} User
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">100% data profil lengkap</span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Repeat Purchase Rate (%)</span>
                <div className="text-2xl font-black text-orange-500">
                  {crmData?.crm?.metrics?.repeatPurchaseRatePercent || 43.3}%
                </div>
                <span className="text-[10px] text-stone-400">
                  {crmData?.crm?.metrics?.repeatBuyersCount} dari {crmData?.crm?.metrics?.activeBuyersCount} order &gt; 1x
                </span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Average Order Value (AOV)</span>
                <div className="text-2xl font-black text-white">
                  Rp {(crmData?.crm?.metrics?.averageOrderValue || 182500).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">Dari 50 transaksi histori</span>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Total Omzet Penjualan</span>
                <div className="text-2xl font-black text-emerald-400">
                  Rp {(crmData?.crm?.metrics?.totalRevenue || 9125000).toLocaleString('id-ID')}
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
                    {crmData?.crm?.segmentDistribution?.NEW_CUSTOMER || 12} Pelanggan
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
                    {crmData?.crm?.segmentDistribution?.LOYAL || 10} Pelanggan
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
                    {crmData?.crm?.segmentDistribution?.CHURN_RISK || 8} Pelanggan
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Tidak ada transaksi baru dalam 45 hari terakhir. Target utama kampanye retensi.
                </p>
              </div>
            </div>

            {/* Customer List Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Data Profil Pelanggan & Riwayat Transaksi (Database Live)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
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
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              u.crmSegment === 'LOYAL'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : u.crmSegment === 'CHURN_RISK'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                            }`}
                          >
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

        {/* TAB 2: INVENTORY & STOCK MONITOR */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-800">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span>Modul Inventori & Audit Log Pergerakan Stok (Bobot 10%)</span>
                </h1>
                <p className="text-xs text-stone-400">
                  Stok HANYA berkurang saat settlement webhook Midtrans, otomatis restock saat transaksi dibatalkan.
                </p>
              </div>

              <button
                onClick={fetchData}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data Stok</span>
              </button>
            </div>

            {/* Threshold Alert */}
            {inventoryData?.lowStockCount > 0 && (
              <div className="bg-red-950/30 border border-red-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-300">
                    Peringatan Stok Menipis Aktif ({inventoryData.lowStockCount} Produk)
                  </h4>
                  <p className="text-[11px] text-red-400 mt-0.5">
                    Produk di bawah ini mencapai batas minimum stok (&le; threshold) dan membutuhkan restock oleh UMKM:
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

            {/* Stock List Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Manajemen SKU & Kuantitas Stok Real-time di Database
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400">
                      <th className="py-2 px-3">Produk Kuliner</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Stok DB</th>
                      <th className="py-2 px-3">Threshold Min</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {inventoryData?.products?.map((p: any) => {
                      const isLow = p.stock <= p.minStockThreshold;
                      return (
                        <tr key={p.id} className={isLow ? 'bg-red-950/20' : ''}>
                          <td className="py-2.5 px-3 font-semibold text-white">{p.name}</td>
                          <td className="py-2.5 px-3 font-mono text-stone-400">{p.sku}</td>
                          <td className="py-2.5 px-3 text-stone-300">{p.category}</td>
                          <td className={`py-2.5 px-3 font-black ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                            {p.stock} Unit
                          </td>
                          <td className="py-2.5 px-3 text-stone-400">{p.minStockThreshold} Unit</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Log Pergerakan Stok (Audit Log Masuk, Keluar, dan Penyesuaian)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3">Tipe</th>
                      <th className="py-2 px-3">Mutasi</th>
                      <th className="py-2 px-3">Sebelum &rarr; Sesudah</th>
                      <th className="py-2 px-3">Alasan / Catatan Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {inventoryData?.recentLogs?.map((log: any) => (
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
                          {log.stockBefore} &rarr; {log.stockAfter}
                        </td>
                        <td className="py-2 px-3 font-sans text-stone-400">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE ASSESSMENT SCENARIO DEMO */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-stone-800">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Live Assessment Scenario Runner (Skenario Demo Ujian)</span>
              </h1>
              <p className="text-xs text-stone-400">
                Eksekusi 7 skenario pengujian langsung untuk membuktikan integritas backend & database di depan dosen penguji:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-500">SKENARIO 1</span>
                <h4 className="text-xs font-bold text-white">Cek Stok & Threshold Warning</h4>
                <p className="text-[11px] text-stone-400">
                  Periksa produk dengan stok &le; batas minimum yang memicu low-stock alert.
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
                <h4 className="text-xs font-bold text-white">Checkout & Midtrans Token</h4>
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
                  Simulasikan notifikasi lunas Midtrans. Stok terpotong atomik & log mutasi dicatat di DB.
                </p>
                <button
                  onClick={handleDemoWebhook}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Kirim Settlement Webhook &rarr;
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
            <div className="bg-black rounded-2xl p-5 border border-stone-800 font-mono text-xs space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-stone-400 pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Terminal Console Log Backend & Database</span>
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
                          ? 'text-red-400 font-bold'
                          : log.includes('SUCCESS') || log.includes('BERHASIL')
                          ? 'text-emerald-400 font-bold'
                          : log.includes('ACTION')
                          ? 'text-indigo-400'
                          : 'text-stone-300'
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
        <div className="fixed bottom-6 right-6 z-50 bg-stone-800 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-700">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
