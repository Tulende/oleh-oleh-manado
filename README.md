# Sentra Kuliner Sulut (Marketplace UMKM Sulawesi Utara)

Platform E-Commerce Full-Stack Sentra Oleh-Oleh & UMKM Kuliner khas Sulawesi Utara (Manado & Minahasa). Dibangun untuk memenuhi kriteria Tugas Akhir dengan integrasi ketat antara **Inventory Locking**, **Server-side Promotions**, **CRM RFM Segmentation**, **Midtrans Sandbox Payment Gateway**, dan **RajaOngkir Ekspedisi**.

---

## 🌟 Fitur Utama & Poin Assessment

### 1. Modul Inventory (Bobot 10%)
* **Stok Per Produk & SKU Khas Sulut:** Mengelola inventori real-time per SKU kuliner.
* **Logic Pemotongan Stok Transaksional:** Stok **HANYA** berkurang saat webhook Midtrans mengonfirmasi status `settlement` atau `capture`, bukan saat checkout/cart.
* **Restock Otomatis:** Stok otomatis kembali jika pesanan berstatus `cancel`, `expire`, atau `refund`.
* **Validation & Anti-Overselling Server-Side:** Sistem menolak checkout dengan HTTP 422 jika permintaan melebihi sisa stok di database.
* **Peringatan Stok Menipis & Audit Log:** Indikator visual merah jika stok $\le$ batas minimum (*threshold*) serta log lengkap setiap mutasi stok masuk/keluar.

### 2. Modul Promosi & Analytics (Bobot 10%)
* **3+ Jenis Promosi:** Diskon Persentase (`PERCENTAGE_DISCOUNT`), Potongan Nominal (`FIXED_DISCOUNT`), Gratis Ongkir (`FREE_SHIPPING`), dan Flash Sale.
* **Server-side Validation:** Validasi tanggal kedaluwarsa, kuota global, limit 1 voucher per user, dan batas minimum belanja.
* **Target Segmen CRM:** Voucher khusus yang dikunci dan hanya bisa diklaim oleh segmen pelanggan tertentu (misal voucher khusus `CHURN_RISK`).
* **Laporan Analytics:** Menghitung total diskon terpakai, omzet yang dihasilkan, dan rasio ROI promo.

### 3. Modul CRM & Customer Retention (Bobot 10%)
* **Profil Pelanggan & Riwayat Transaksi Komprehensif.**
* **Segmentasi Otomatis (RFM):**
  * `NEW_CUSTOMER`: Order 1x atau baru terdaftar $\le$ 30 hari.
  * `LOYAL`: Order $\ge$ 3 kali dan total belanja $\ge$ Rp 500.000.
  * `CHURN_RISK`: Tidak ada transaksi baru dalam 45 hari terakhir.
* **Aksi Retensi Terintegrasi:** Tombol 1-klik untuk menerbitkan dan mengirim voucher retensi ke segmen yang tidak aktif.
* **Dashboard Metrik CRM:** Real-time Total Pelanggan, Repeat Purchase Rate (%), dan Average Order Value (AOV).

### 4. Fitur Spesifik Kuliner Sulawesi Utara
* **Opsi Kemasan Khusus / Vacuum Sealed:** Opsi kemasan hampa udara tahan kirim luar kota hingga 14 hari (+Rp 5.000).
* **Integrasi Cek Ongkir & Kurir:** API RajaOngkir untuk ekspedisi nasional (JNE/POS) + Kurir Lokal Instan Manado/Minahasa.
* **Sistem Ulasan Visual:** Galeri foto asli produk kiriman pembeli terverifikasi (*verified purchase*) beserta rating bintang.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Jalankan Seeder
```bash
# Push skema database ke SQLite local
npm run db:push

# Jalankan seeder (22 Produk Manado, 30 Pelanggan, 50 Transaksi Histori)
npm run db:seed
```

### 3. Jalankan Server Development
```bash
npm run dev
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Panduan Live Skenario Demo (Ujian Tugas Akhir)

Aplikasi telah dilengkapi tab **"Live Scenario Demo"** di antarmuka web untuk mendemokan alur pengujian secara langsung:
1. **Langkah 1 (Stok Awal):** Buka tab *Inventori* & periksa produk berstatus *Low Stock Alert* (contoh: Klappertaart stok sisa 3 $\le$ threshold 5).
2. **Langkah 2 (Validasi Promo):** Cek voucher `MANADOBARU20` di checkout (lolos validasi server). Coba ubah kode asal-asalan untuk melihat penolakan server.
3. **Langkah 3 (Checkout):** Klik checkout untuk membuat pesanan berstatus `PENDING_PAYMENT` dan menerima token Snap Midtrans. Periksa bahwa stok di database **belum berkurang**.
4. **Langkah 4 (Webhook Settlement):** Klik tombol *Kirim Settlement Webhook*. Status order berubah menjadi `SETTLEMENT`, stok terpotong otomatis di DB, dan log mutasi stok bertambah.
5. **Langkah 5 (Segmentasi CRM):** Buka tab *CRM*, periksa bahwa status segmen user otomatis naik sesuai transaksi barunya.
6. **Langkah 6 (Aksi Retensi):** Klik tombol *Kirim Voucher Retensi ke Churn Risk* untuk mendistribusikan voucher diskon khusus.
7. **Langkah 7 (Anti-Overselling Guard):** Klik tombol *Uji Anti-Overselling (Beli 9.999 Unit)*. Server langsung menolak pesanan dengan status 422 dan transaksi dibatalkan sebelum Snap token dibuat.

---

## ☁️ Deployment Cloudflare & GitHub Workflow
Proyek Next.js ini menggunakan Cloudflare Workers melalui adapter OpenNext. Jalankan dari root proyek:

```bash
# Login Wrangler ke akun Cloudflare
npx --offline=false wrangler login

# Buat D1 dan salin database_id dari hasil perintah ini
npm run d1:create
```

Masukkan `database_id` hasil pembuatan D1 ke `wrangler.toml`, menggantikan nilai `PLACEHOLDER_REPLACE_AFTER_D1_CREATE`. Jangan deploy sebelum nilai tersebut diganti. Terapkan skema database:

```bash
npm run d1:migrate:prod
```

Di Cloudflare Workers Builds, atur **Build command** ke `npm run cf:build` dan **Deploy command** ke `npm run cf:deploy`. Error `.open-next/worker.js was not found` muncul jika build command hanya `npm run build` atau deploy command langsung `npx wrangler deploy`, karena langkah itu melewati adapter OpenNext.

Untuk preview lokal jalankan `npm run cf:preview`; untuk build dan deploy sekaligus dari terminal jalankan `npm run deploy`. Perintah ini mengunduh OpenNext dan Wrangler melalui npm saat dijalankan.

Atur rahasia yang diperlukan di Cloudflare Workers (`MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan `RAJAONGKIR_API_KEY`) sebelum aplikasi menerima trafik. Atur juga `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dan `NEXT_PUBLIC_APP_URL` di konfigurasi Worker. Jangan commit nilai rahasia ke repo.

Security headers dikonfigurasi di `next.config.mjs` (X-Frame-Options, HSTS, Referrer-Policy, dan Permissions-Policy).
