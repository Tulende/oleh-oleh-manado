import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Database E-Commerce Sentra Kuliner Sulut ---');

  // Bersihkan data lama jika ada
  await prisma.review.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.promotionUsage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('1. Membuat Akun Admin & 30 Data Pelanggan...');

  // Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sentrasulut.com',
      name: 'Administrator Sentra Sulut',
      role: 'ADMIN',
      phone: '0811430001',
    },
  });

  // 30 Pelanggan dengan Marga & Nama Khas Sulawesi Utara
  const customerNames = [
    { name: 'Griselda Tumewu', email: 'griselda.tumewu@gmail.com', phone: '08124110001', city: 'Manado' },
    { name: 'Fernando Mandagi', email: 'fernando.mandagi@gmail.com', phone: '08124110002', city: 'Jakarta Selatan' },
    { name: 'David Wenas', email: 'david.wenas@gmail.com', phone: '08124110003', city: 'Surabaya' },
    { name: 'Regina Paat', email: 'regina.paat@gmail.com', phone: '08124110004', city: 'Tomohon' },
    { name: 'Claudio Lumempouw', email: 'claudio.lumempouw@gmail.com', phone: '08124110005', city: 'Manado' },
    { name: 'Jesica Sompie', email: 'jesica.sompie@gmail.com', phone: '08124110006', city: 'Makassar' },
    { name: 'Michael Sondakh', email: 'michael.sondakh@gmail.com', phone: '08124110007', city: 'Bandung' },
    { name: 'Patricia Rantung', email: 'patricia.rantung@gmail.com', phone: '08124110008', city: 'Tangerang' },
    { name: 'Samuel Wowor', email: 'samuel.wowor@gmail.com', phone: '08124110009', city: 'Bekasi' },
    { name: 'Natalia Polii', email: 'natalia.polii@gmail.com', phone: '08124110010', city: 'Minahasa Utara' },
    { name: 'Kevin Rompis', email: 'kevin.rompis@gmail.com', phone: '08124110011', city: 'Jakarta Pusat' },
    { name: 'Maria Kalalo', email: 'maria.kalalo@gmail.com', phone: '08124110012', city: 'Depok' },
    { name: 'Daniel Pangemanan', email: 'daniel.p@gmail.com', phone: '08124110013', city: 'Manado' },
    { name: 'Cindy Tendean', email: 'cindy.tendean@gmail.com', phone: '08124110014', city: 'Semarang' },
    { name: 'Bryan Warouw', email: 'bryan.warouw@gmail.com', phone: '08124110015', city: 'Denpasar' },
    { name: 'Stevani Lasut', email: 'stevani.lasut@gmail.com', phone: '08124110016', city: 'Bitung' },
    { name: 'Raymond Supit', email: 'raymond.supit@gmail.com', phone: '08124110017', city: 'Yogyakarta' },
    { name: 'Michelle Mamahit', email: 'michelle.m@gmail.com', phone: '08124110018', city: 'Balikpapan' },
    { name: 'Christian Rumbayan', email: 'christian.r@gmail.com', phone: '08124110019', city: 'Surabaya' },
    { name: 'Natasha Senduk', email: 'natasha.senduk@gmail.com', phone: '08124110020', city: 'Jakarta Barat' },
    { name: 'Rendy Sumual', email: 'rendy.sumual@gmail.com', phone: '08124110021', city: 'Manado' },
    { name: 'Olivia Kaunang', email: 'olivia.kaunang@gmail.com', phone: '08124110022', city: 'Bogor' },
    { name: 'Jason Moniaga', email: 'jason.moniaga@gmail.com', phone: '08124110023', city: 'Malang' },
    { name: 'Stefani Mandey', email: 'stefani.mandey@gmail.com', phone: '08124110024', city: 'Kotamobagu' },
    { name: 'Aldi Karundeng', email: 'aldi.karundeng@gmail.com', phone: '08124110025', city: 'Jakarta Timur' },
    { name: 'Novita Kolondam', email: 'novita.k@gmail.com', phone: '08124110026', city: 'Pontianak' },
    { name: 'Glenn Dotulong', email: 'glenn.dotulong@gmail.com', phone: '08124110027', city: 'Surakarta' },
    { name: 'Angelia Taroreh', email: 'angelia.t@gmail.com', phone: '08124110028', city: 'Medan' },
    { name: 'Joshua Tombeng', email: 'joshua.tombeng@gmail.com', phone: '08124110029', city: 'Manado' },
    { name: 'Vania Rondonuwu', email: 'vania.r@gmail.com', phone: '08124110030', city: 'Palembang' },
  ];

  const createdUsers = [];
  for (const c of customerNames) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: 'CUSTOMER',
        crmSegment: 'NEW_CUSTOMER',
      },
    });
    createdUsers.push({ ...user, city: c.city });
  }

  console.log('2. Menanam 22 Produk Kuliner Khas Sulawesi Utara...');

  const productsData = [
    {
      sku: 'MN-CKL-001',
      name: 'Cakalang Fufu Asap Utuh (Grade A - 500g)',
      slug: 'cakalang-fufu-asap-500g',
      category: 'Olahan Ikan',
      description: 'Ikan cakalang segar diasap tradisional sabut kelapa dari pesisir Bitung. Daging tebal, gurih, dan wangi khas Minahasa.',
      price: 65000,
      stock: 45,
      minStockThreshold: 10,
      weightInGrams: 550,
      isPerishable: false,
      shelfLifeDays: 14,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 5000,
      imageUrl: '/images/products/cakalang-fufu.jpg',
    },
    {
      sku: 'MN-ROA-002',
      name: 'Sambal Roa Judes Asli Manado (Botol 150g)',
      slug: 'sambal-roa-judes-150g',
      category: 'Sambal',
      description: 'Sambal roa asli dengan komposisi ikan roa asap melimpah, cabai rawit merah, dan minyak kelapa khas Sulawesi Utara.',
      price: 45000,
      stock: 75,
      minStockThreshold: 15,
      weightInGrams: 200,
      isPerishable: false,
      shelfLifeDays: 90,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/sambal-roa.jpg',
    },
    {
      sku: 'MN-KLP-003',
      name: 'Klappertaart Original Manado (Large Foil Cup)',
      slug: 'klappertaart-original-manado-large',
      category: 'Kue Khas',
      description: 'Kue custard kelapa muda khas Manado bertekstur lembut dengan taburan kayu manis bubuk, kismis, dan almond panggang.',
      price: 55000,
      stock: 3, // Peringatan Low-Stock Demo! (<= threshold 5)
      minStockThreshold: 5,
      weightInGrams: 400,
      isPerishable: true,
      shelfLifeDays: 4,
      allowedPackaging: 'FROZEN_CHILLED',
      vacuumExtraFee: 8000,
      imageUrl: '/images/products/klappertaart.jpg',
    },
    {
      sku: 'MN-HLU-004',
      name: 'Halua Kenari Gula Aren Minahasa (250g)',
      slug: 'halua-kenari-gula-aren-250g',
      category: 'Snack Kering',
      description: 'Kacang kenari pilihan diselimuti karamel gula aren asli Tomohon. Renyah, manis legit dan wangi alami.',
      price: 50000,
      stock: 35,
      minStockThreshold: 8,
      weightInGrams: 280,
      isPerishable: false,
      shelfLifeDays: 60,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/halua-kenari.jpg',
    },
    {
      sku: 'MN-PND-005',
      name: 'Panada Ikan Cakalang Frozen Pack (Isi 10 pcs)',
      slug: 'panada-ikan-cakalang-frozen-10',
      category: 'Kue Khas',
      description: 'Roti goreng khas Manado dengan isian ikan cakalang bumbu pampis pedas gurih. Tinggal digoreng hangat.',
      price: 40000,
      stock: 22,
      minStockThreshold: 8,
      weightInGrams: 500,
      isPerishable: true,
      shelfLifeDays: 30,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 5000,
      imageUrl: '/images/products/panada.jpg',
    },
    {
      sku: 'MN-TNT-006',
      name: 'Tinutuan / Bubur Manado Instan Pack (4 Porsi)',
      slug: 'tinutuan-bubur-manado-instan',
      category: 'Olahan Makanan',
      description: 'Paket racikan labu kuning, jagung manis, dan bumbu rempah bubur Manado instan. Sehat, praktis dan otentik.',
      price: 35000,
      stock: 50,
      minStockThreshold: 10,
      weightInGrams: 350,
      isPerishable: false,
      shelfLifeDays: 120,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/tinutuan.jpg',
    },
    {
      sku: 'MN-PIA-007',
      name: 'Pia Amurang Crispy Khas Minsel (Box 12 pcs)',
      slug: 'pia-amurang-crispy-12pcs',
      category: 'Snack Kering',
      description: 'Pia renyah berlapis khas kota Amurang dengan isian kacang hijau manis legit dan keju cheddar.',
      price: 48000,
      stock: 40,
      minStockThreshold: 10,
      weightInGrams: 450,
      isPerishable: false,
      shelfLifeDays: 45,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/pia-amurang.jpg',
    },
    {
      sku: 'MN-DDL-008',
      name: 'Dodol Amurang Bungkus Janur Asli (500g)',
      slug: 'dodol-amurang-janur-500g',
      category: 'Snack Tradisional',
      description: 'Dodol khas Minahasa Selatan dibungkus daun kelapa/janur alami dengan aroma gula aren wangi khas.',
      price: 38000,
      stock: 28,
      minStockThreshold: 6,
      weightInGrams: 550,
      isPerishable: false,
      shelfLifeDays: 30,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/dodol-amurang.jpg',
    },
    {
      sku: 'MN-ABN-009',
      name: 'Abon Ikan Cakalang Pedas Gurih (Pouch 200g)',
      slug: 'abon-ikan-cakalang-pedas-200g',
      category: 'Olahan Ikan',
      description: 'Abon serat daging cakalang asli dengan bumbu rempah pedas cabai rawit Manado. Teman setia nasi hangat.',
      price: 42000,
      stock: 60,
      minStockThreshold: 12,
      weightInGrams: 230,
      isPerishable: false,
      shelfLifeDays: 180,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/abon-cakalang.jpg',
    },
    {
      sku: 'MN-PLA-010',
      name: 'Biji Pala Manado Utuh Grade Export (Pouch 250g)',
      slug: 'biji-pala-manado-export-250g',
      category: 'Bumbu Rempah',
      description: 'Biji pala aromatik kualitas terbaik dari kepulauan Siau-Tagulandang-Biaro (Sitaro), beraroma minyak atsiri pekat.',
      price: 55000,
      stock: 4, // Peringatan Low-Stock Demo! (<= threshold 8)
      minStockThreshold: 8,
      weightInGrams: 280,
      isPerishable: false,
      shelfLifeDays: 365,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 4000,
      imageUrl: '/images/products/biji-pala.jpg',
    },
    {
      sku: 'MN-BKS-011',
      name: 'Sambal Bakasang Ikan Cakalang Asli (150g)',
      slug: 'sambal-bakasang-cakalang-150g',
      category: 'Sambal',
      description: 'Sambal fermentasi telur & jeroan ikan cakalang tradisional Minahasa dengan cita rasa gurih asam pedas nan eksotis.',
      price: 35000,
      stock: 18,
      minStockThreshold: 5,
      weightInGrams: 200,
      isPerishable: false,
      shelfLifeDays: 60,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/sambal-bakasang.jpg',
    },
    {
      sku: 'MN-BRN-012',
      name: 'Sup Brenebon Kacang Merah Instan (Pack 400g)',
      slug: 'sup-brenebon-kacang-merah-instan',
      category: 'Olahan Makanan',
      description: 'Bumbu sup kacang merah khas Belanda-Minahasa lengkap dengan kaldu daging gurih dan pala bubuk wangi.',
      price: 36000,
      stock: 32,
      minStockThreshold: 7,
      weightInGrams: 420,
      isPerishable: false,
      shelfLifeDays: 90,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/brenebon.jpg',
    },
    {
      sku: 'MN-CCR-013',
      name: 'Kue Cucur Minahasa Gula Aren (Pack 6 pcs)',
      slug: 'kue-cucur-minahasa-6pcs',
      category: 'Kue Tradisional',
      description: 'Kue tradisional berserat renda dengan cita rasa gula aren asli dan kayu manis khas pesta adat Manado.',
      price: 25000,
      stock: 15,
      minStockThreshold: 5,
      weightInGrams: 300,
      isPerishable: true,
      shelfLifeDays: 5,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 4000,
      imageUrl: '/images/products/kue-cucur.jpg',
    },
    {
      sku: 'MN-LLM-014',
      name: 'Lalampa Bakar Ikan Cakalang Frozen (Isi 10 pcs)',
      slug: 'lalampa-bakar-cakalang-frozen-10',
      category: 'Kue Tradisional',
      description: 'Ketan pulen isi abon cakalang pedas dibungkus daun pisang yang telah dibakar harum. Siap dihangatkan.',
      price: 45000,
      stock: 2, // Peringatan Low-Stock Demo! (<= threshold 5)
      minStockThreshold: 5,
      weightInGrams: 600,
      isPerishable: true,
      shelfLifeDays: 30,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 5000,
      imageUrl: '/images/products/lalampa.jpg',
    },
    {
      sku: 'MN-NSK-015',
      name: 'Nasi Kuning Manado Komplit Frozen Meal (350g)',
      slug: 'nasi-kuning-manado-komplit-frozen',
      category: 'Olahan Makanan',
      description: 'Nasi kuning daun woka lengkap dengan abon cakalang, semur daging, telur iris, dan sambal roa.',
      price: 38000,
      stock: 25,
      minStockThreshold: 6,
      weightInGrams: 400,
      isPerishable: true,
      shelfLifeDays: 30,
      allowedPackaging: 'FROZEN_CHILLED',
      vacuumExtraFee: 6000,
      imageUrl: '/images/products/nasi-kuning.jpg',
    },
    {
      sku: 'MN-WKU-016',
      name: 'Bumbu Pasta Woku Belanga Minahasa (Jar 200g)',
      slug: 'bumbu-woku-belanga-jar-200g',
      category: 'Bumbu Rempah',
      description: 'Pasta bumbu woku kaya rempah: kemangi, daun pandan, kunyit, jahe, dan cabai rawit. Siap masak ikan/ayam.',
      price: 32000,
      stock: 55,
      minStockThreshold: 10,
      weightInGrams: 250,
      isPerishable: false,
      shelfLifeDays: 120,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/bumbu-woku.jpg',
    },
    {
      sku: 'MN-BGA-017',
      name: 'Bagea Kenari Manado Crunchy (Pouch 250g)',
      slug: 'bagea-kenari-manado-250g',
      category: 'Snack Kering',
      description: 'Kue kering sagu khas Manado dengan cacahan kenari gurih dan wangi rempah kayu manis.',
      price: 30000,
      stock: 44,
      minStockThreshold: 8,
      weightInGrams: 280,
      isPerishable: false,
      shelfLifeDays: 90,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/bagea-kenari.jpg',
    },
    {
      sku: 'MN-GHU-018',
      name: 'Gohu Manado Pepaya Kuah Cuka Terasi (Pack 300g)',
      slug: 'gohu-manado-pepaya-300g',
      category: 'Kuliner Segar',
      description: 'Asinan pepaya mengkal khas Manado dengan kuah segar cuka, jahe, cabai, dan terasi sangrai aromatik.',
      price: 28000,
      stock: 16,
      minStockThreshold: 5,
      weightInGrams: 350,
      isPerishable: true,
      shelfLifeDays: 7,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/gohu-manado.jpg',
    },
    {
      sku: 'MN-MSB-019',
      name: 'Ikan Mas Bakar Rica Frozen Pack (500g)',
      slug: 'ikan-mas-bakar-rica-frozen-500g',
      category: 'Olahan Ikan',
      description: 'Ikan mas segar Minahasa yang dibakar dengan sambal rica pedas berlimpah. Kemasan vacuum tahan kirim.',
      price: 52000,
      stock: 20,
      minStockThreshold: 5,
      weightInGrams: 550,
      isPerishable: true,
      shelfLifeDays: 30,
      allowedPackaging: 'VACUUM_SEALED',
      vacuumExtraFee: 5000,
      imageUrl: '/images/products/ikan-mas-bakar.jpg',
    },
    {
      sku: 'MN-KLA-020',
      name: 'Klappertaart Keju Almond Medium Cup (250g)',
      slug: 'klappertaart-keju-almond-medium',
      category: 'Kue Khas',
      description: 'Varian klappertaart dengan limpahan parutan keju edam dan taburan almond panggang renyah.',
      price: 35000,
      stock: 18,
      minStockThreshold: 5,
      weightInGrams: 280,
      isPerishable: true,
      shelfLifeDays: 4,
      allowedPackaging: 'FROZEN_CHILLED',
      vacuumExtraFee: 6000,
      imageUrl: '/images/products/klappertaart-keju.jpg',
    },
    {
      sku: 'MN-DBD-021',
      name: 'Sambal Dabu-Dabu Lemong Cui Segar (Jar 150g)',
      slug: 'sambal-dabu-dabu-lemong-cui',
      category: 'Sambal',
      description: 'Irisan tomat hijau, cabai rawit merah, dan bawang merah disiram perasan jeruk lemong cui khas Manado.',
      price: 28000,
      stock: 30,
      minStockThreshold: 6,
      weightInGrams: 180,
      isPerishable: true,
      shelfLifeDays: 14,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/dabu-dabu.jpg',
    },
    {
      sku: 'MN-MPL-022',
      name: 'Manisan Buah Pala Kering Khas Sitaro (250g)',
      slug: 'manisan-buah-pala-kering-sitaro',
      category: 'Snack Kering',
      description: 'Daging buah pala segar pulau Siau diolah manisan berbalut gula pasir renyah. Cita rasa hangat menyegarkan tenggorokan.',
      price: 32000,
      stock: 38,
      minStockThreshold: 8,
      weightInGrams: 270,
      isPerishable: false,
      shelfLifeDays: 180,
      allowedPackaging: 'STANDARD',
      vacuumExtraFee: 0,
      imageUrl: '/images/products/manisan-pala.jpg',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    // Buat initial log stok masuk dari UMKM
    await prisma.inventoryLog.create({
      data: {
        productId: prod.id,
        type: 'IN_PURCHASE',
        quantityChange: prod.stock + 20,
        stockBefore: 0,
        stockAfter: prod.stock + 20,
        reason: 'Restock batch perdana Sentra UMKM Kuliner Manado',
        actorId: admin.id,
      },
    });
  }

  console.log('3. Membuat Master Promosi & Voucher Diskon...');

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);

  const pastDate = new Date();
  pastDate.setDate(now.getDate() - 60);

  // Promo 1: Diskon Persen Pelanggan Baru
  const promoNew = await prisma.promotion.create({
    data: {
      code: 'MANADOBARU20',
      name: 'Diskon Sambutan Pelanggan Baru 20%',
      description: 'Diskon 20% maksimal Rp 30.000 khusus pesanan pertama',
      type: 'PERCENTAGE_DISCOUNT',
      value: 20,
      maxDiscountAmount: 30000,
      minOrderAmount: 50000,
      totalQuota: 200,
      usedQuota: 18,
      limitPerUser: 1,
      startDate: pastDate,
      endDate: nextMonth,
      isActive: true,
      targetSegment: null, // Terbuka untuk umum
    },
  });

  // Promo 2: Gratis Ongkir Min. Belanja
  const promoShipping = await prisma.promotion.create({
    data: {
      code: 'ONGKIRGRATIS',
      name: 'Voucher Subsidi Ongkir Seluruh Indonesia',
      description: 'Potongan ongkos kirim hingga Rp 25.000 dengan min. belanja Rp 100.000',
      type: 'FREE_SHIPPING',
      value: 25000,
      minOrderAmount: 100000,
      totalQuota: 150,
      usedQuota: 22,
      limitPerUser: 2,
      startDate: pastDate,
      endDate: nextMonth,
      isActive: true,
      targetSegment: null,
    },
  });

  // Promo 3: Voucher Khusus Target Segmen CRM "CHURN_RISK"
  const promoRetention = await prisma.promotion.create({
    data: {
      code: 'KANGENKULINER25',
      name: 'Voucher Retensi Spesial Kangen Rasa Manado',
      description: 'Diskon 25% khusus dikirimkan ke pelanggan segmen Tidak Aktif / Churn Risk',
      type: 'PERCENTAGE_DISCOUNT',
      value: 25,
      maxDiscountAmount: 40000,
      minOrderAmount: 75000,
      totalQuota: 50,
      usedQuota: 4,
      limitPerUser: 1,
      startDate: pastDate,
      endDate: nextMonth,
      isActive: true,
      targetSegment: 'CHURN_RISK', // KUNCI SPESIFIK KE SEGMEN CRM!
    },
  });

  // Promo 4: Flash Sale / Bundling
  const promoFlash = await prisma.promotion.create({
    data: {
      code: 'FLASHSALEBITUNG',
      name: 'Flash Sale Pesta Cakalang & Sambal Roa',
      description: 'Potongan langsung Rp 15.000',
      type: 'FIXED_DISCOUNT',
      value: 15000,
      minOrderAmount: 80000,
      totalQuota: 100,
      usedQuota: 10,
      limitPerUser: 1,
      startDate: pastDate,
      endDate: nextMonth,
      isActive: true,
      targetSegment: null,
    },
  });

  console.log('4. Menanam 50 Transaksi Histori (Membentuk Metrik CRM & Repeat Purchase)...');

  // Distribusi 50 transaksi:
  // - User 0-9 (Griselda, David, Regina, dll.): Repeat buyers (3-5 kali order) -> LOYAL
  // - User 10-17: Order 1-2 kali baru-baru ini -> NEW_CUSTOMER & POTENTIAL_LOYAL
  // - User 18-25: Order 1-2 kali tapi 50-60 hari lalu -> CHURN_RISK
  // - User 26-29: Belum order / order 1 -> NEW_CUSTOMER

  const courierList = [
    { name: 'JNE - REG', fee: 35000 },
    { name: 'JNE - YES', fee: 48000 },
    { name: 'POS Kilat Khusus', fee: 30000 },
    { name: 'Kurir Lokal Manado', fee: 15000 },
  ];

  let orderCounter = 1;

  for (let i = 0; i < 50; i++) {
    // Tentukan user target
    let targetUserIndex = 0;
    let daysAgo = 5;

    if (i < 25) {
      // Pembeli loyal (user 0 hingga 7 belanja berulang)
      targetUserIndex = i % 8;
      daysAgo = Math.floor(2 + (i % 20)); // Baru dalam 2-22 hari terakhir
    } else if (i < 37) {
      // Pembeli baru (user 8 hingga 17)
      targetUserIndex = 8 + (i % 10);
      daysAgo = Math.floor(1 + (i % 15)); // Baru dalam 1-15 hari
    } else {
      // Pelanggan tidak aktif / churn risk (user 18 hingga 25 transaksi lama)
      targetUserIndex = 18 + (i % 8);
      daysAgo = Math.floor(48 + (i % 14)); // 48-62 hari yang lalu!
    }

    const customer = createdUsers[targetUserIndex];
    const orderDate = new Date();
    orderDate.setDate(now.getDate() - daysAgo);

    // Pilih 1 hingga 3 produk secara acak
    const p1 = createdProducts[i % createdProducts.length];
    const p2 = createdProducts[(i + 3) % createdProducts.length];
    const selectedCourier = courierList[i % courierList.length];

    const isVacuum1 = p1.allowedPackaging === 'VACUUM_SEALED';
    const vacFee1 = isVacuum1 ? p1.vacuumExtraFee : 0;
    const qty1 = 1 + (i % 2);
    const itemSubtotal1 = (p1.price + vacFee1) * qty1;

    const qty2 = (i % 3 === 0) ? 1 : 0;
    const itemSubtotal2 = qty2 > 0 ? p2.price * qty2 : 0;

    const itemsTotal = itemSubtotal1 + itemSubtotal2;
    const packagingTotal = vacFee1 * qty1;
    const shippingFee = selectedCourier.fee;

    // Kadang pakai promo
    let discount = 0;
    let promoRef = null;
    if (i % 3 === 0) {
      discount = 15000;
      promoRef = promoFlash;
    } else if (i % 5 === 0) {
      discount = 20000;
      promoRef = promoNew;
    }

    const grandTotal = itemsTotal + packagingTotal + shippingFee - discount;
    const invoiceNum = `INV-SLT-2026-${String(orderCounter).padStart(4, '0')}`;
    orderCounter++;

    // Buat order dengan status SETTLEMENT (sudah dibayar Midtrans)
    const order = await prisma.order.create({
      data: {
        invoiceNumber: invoiceNum,
        userId: customer.id,
        itemsTotal,
        packagingFee: packagingTotal,
        shippingFee,
        discountTotal: discount,
        grandTotal,
        promotionId: promoRef ? promoRef.id : null,
        status: 'SETTLEMENT',
        courierName: selectedCourier.name,
        trackingNumber: `SULUT-${Math.floor(10000000 + Math.random() * 90000000)}`,
        shippingAddress: `Jl. Tikala Ares No. ${i + 12}, Manado`,
        shippingCity: customer.city,
        postalCode: '95124',
        paymentType: i % 2 === 0 ? 'gopay' : 'qris',
        paidAt: orderDate,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              productId: p1.id,
              quantity: qty1,
              unitPrice: p1.price,
              packagingChoice: isVacuum1 ? 'VACUUM_SEALED' : 'STANDARD',
              subtotal: itemSubtotal1,
            },
            ...(qty2 > 0
              ? [
                  {
                    productId: p2.id,
                    quantity: qty2,
                    unitPrice: p2.price,
                    packagingChoice: 'STANDARD',
                    subtotal: itemSubtotal2,
                  },
                ]
              : []),
          ],
        },
      },
    });

    // Catat log stok keluar pada order settlement tersebut
    await prisma.inventoryLog.create({
      data: {
        productId: p1.id,
        orderId: order.id,
        type: 'OUT_SETTLEMENT',
        quantityChange: -qty1,
        stockBefore: p1.stock + qty1,
        stockAfter: p1.stock,
        reason: `Settlement Webhook Midtrans #${order.invoiceNumber}`,
        createdAt: orderDate,
      },
    });

    // Catat riwayat promo usage jika ada diskon
    if (promoRef && discount > 0) {
      await prisma.promotionUsage.create({
        data: {
          promotionId: promoRef.id,
          userId: customer.id,
          orderId: order.id,
          discountApplied: discount,
          createdAt: orderDate,
        },
      });

      // Update total promo
      await prisma.promotion.update({
        where: { id: promoRef.id },
        data: {
          totalDiscountGiven: { increment: discount },
          totalRevenueGenerated: { increment: grandTotal },
        },
      });
    }
  }

  console.log('5. Mengalkulasi Metrik CRM Pelanggan...');

  // Kalkulasi RFM untuk masing-masing user
  for (const user of createdUsers) {
    const orders = await prisma.order.findMany({
      where: { userId: user.id, status: 'SETTLEMENT' },
      orderBy: { paidAt: 'desc' },
    });

    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const lastOrder = orders[0];
    const lastOrderAt = lastOrder?.paidAt || null;

    let segment = 'NEW_CUSTOMER';
    if (orderCount === 0) {
      segment = 'NEW_CUSTOMER';
    } else {
      const daysSince = lastOrderAt
        ? Math.floor((now.getTime() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSince >= 45) {
        segment = 'CHURN_RISK';
      } else if (orderCount >= 3 && totalSpent >= 500000) {
        segment = 'LOYAL';
      } else if (orderCount >= 2) {
        segment = 'POTENTIAL_LOYAL';
      } else {
        segment = 'NEW_CUSTOMER';
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        orderCount,
        totalSpent,
        lastOrderAt,
        crmSegment: segment,
      },
    });
  }

  console.log('6. Menanam Visual Reviews dengan Foto Pembeli...');

  const reviewSamples = [
    {
      prodIndex: 0, // Cakalang Fufu
      userIndex: 0,
      rating: 5,
      comment: 'Cakalang fufu asapnya wangi sekali! Dagingnya tebal dan tidak amis. Pilihan kemasan vacuum sangat membantu pas dikirim ke luar Manado tetap segar.',
      photoUrl: '/images/reviews/cakalang-review-1.jpg',
    },
    {
      prodIndex: 1, // Sambal Roa
      userIndex: 2,
      rating: 5,
      comment: 'Sambal roa terenak yang pernah saya coba, ikan roanya beneran melimpah bukan cuma minyak sama cabai. Pedasnya pas!',
      photoUrl: '/images/reviews/sambal-roa-review-1.jpg',
    },
    {
      prodIndex: 2, // Klappertaart
      userIndex: 3,
      rating: 5,
      comment: 'Klappertaartnya juara! Custard lembut, kelapa mudanya banyak, kayu manis dan almondnya harum banget.',
      photoUrl: '/images/reviews/klappertaart-review-1.jpg',
    },
    {
      prodIndex: 3, // Halua Kenari
      userIndex: 1,
      rating: 5,
      comment: 'Kacang kenari renyah diselimuti gula aren manis legit. Cocok banget buat oleh-oleh dan teman ngopi sore.',
      photoUrl: '/images/reviews/halua-review-1.jpg',
    },
    {
      prodIndex: 4, // Panada
      userIndex: 5,
      rating: 4,
      comment: 'Panada frozen digoreng pas sarapan, kulitnya empuk dan pampis cakalangnya pedas gurih. Mantap!',
      photoUrl: '/images/reviews/panada-review-1.jpg',
    },
  ];

  for (const r of reviewSamples) {
    await prisma.review.create({
      data: {
        productId: createdProducts[r.prodIndex].id,
        userId: createdUsers[r.userIndex].id,
        rating: r.rating,
        comment: r.comment,
        photoUrl: r.photoUrl,
        isVerified: true,
      },
    });
  }

  console.log('--- SEED DATABASE BERHASIL SEPENUHNYA! ---');
  console.log('✔ 22 Produk Kuliner Khas Sulut terdaftar');
  console.log('✔ 30 Pelanggan terdaftar dengan segmentasi RFM lengkap');
  console.log('✔ 50 Transaksi histori terkonfirmasi Midtrans settlement');
  console.log('✔ Audit log inventori, promosi, dan visual review siap diuji!');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
