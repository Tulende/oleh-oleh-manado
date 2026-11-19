-- Promotion data matching the three CRM segments shown on the admin dashboard.
-- Safe to re-run: existing promotion codes are left untouched.
INSERT INTO "Promotion" (
  "id", "code", "name", "description", "type", "value", "maxDiscountAmount",
  "minOrderAmount", "totalQuota", "usedQuota", "limitPerUser", "startDate",
  "endDate", "isActive", "targetSegment", "totalRevenueGenerated",
  "totalDiscountGiven", "createdAt", "updatedAt"
) VALUES
  (
    'promo-crm-new-2026', 'SAMBUTAN15', 'Promo Sambutan Pelanggan Baru',
    'Diskon 15% untuk pelanggan baru / pesanan pertama.', 'PERCENTAGE_DISCOUNT', 15, 25000,
    50000, 100, 0, 1, '2026-11-19T00:00:00.000Z', '2026-12-19T23:59:59.000Z',
    1, 'NEW_CUSTOMER', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'promo-crm-loyal-2026', 'LOYALONGKIR', 'Gratis Ongkir Pelanggan Loyal',
    'Potongan ongkos kirim hingga Rp 35.000 untuk pelanggan loyal dengan minimum belanja Rp 100.000.', 'FREE_SHIPPING', 35000, NULL,
    100000, 100, 0, 1, '2026-11-19T00:00:00.000Z', '2026-12-19T23:59:59.000Z',
    1, 'LOYAL', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'promo-crm-churn-2026', 'KANGEN25', 'Voucher Retensi Pelanggan Tidak Aktif',
    'Diskon 25% khusus pelanggan yang tidak bertransaksi lebih dari 45 hari.', 'PERCENTAGE_DISCOUNT', 25, 40000,
    75000, 100, 0, 1, '2026-11-19T00:00:00.000Z', '2026-12-19T23:59:59.000Z',
    1, 'CHURN_RISK', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT("code") DO NOTHING;
