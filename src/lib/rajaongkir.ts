export interface ShippingCostOption {
  courierCode: string;
  service: string;
  description: string;
  cost: number;
  etd: string; // Estimated Time of Delivery (e.g., "1-2 hari")
}

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || 'rajaongkir_demo_key_sulut_market';
const ORIGIN_CITY_ID = process.env.RAJAONGKIR_ORIGIN_CITY_ID || '266'; // 266 = Kota Manado

/**
 * Kalkulasi Ongkir Ekspedisi Nasional (JNE/POS) + Opsi Kurir Lokal Manado
 */
export async function calculateShippingOptions(params: {
  destinationCityId: string;
  weightInGrams: number;
  courier?: string; // 'jne' | 'pos' | 'lokal'
}): Promise<ShippingCostOption[]> {
  const { destinationCityId, weightInGrams } = params;

  // Jika tujuan adalah pengiriman lokal Sulawesi Utara
  if (destinationCityId === 'lokal_manado' || destinationCityId === '266') {
    return [
      {
        courierCode: 'LOKAL',
        service: 'INSTAN-MANADO',
        description: 'Kurir Lokal Instan Manado (Same Day)',
        cost: 15000,
        etd: 'Hari yang sama (3-4 jam)',
      },
      {
        courierCode: 'LOKAL',
        service: 'MINAHASA-TOMOHON',
        description: 'Kurir Antar Kota Minahasa & Tomohon',
        cost: 25000,
        etd: '1 hari',
      },
    ];
  }

  // Coba integrasi live RajaOngkir jika API key valid
  try {
    const res = await fetch('https://api.rajaongkir.com/starter/cost', {
      method: 'POST',
      headers: {
        key: RAJAONGKIR_API_KEY,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: ORIGIN_CITY_ID,
        destination: destinationCityId,
        weight: Math.max(1000, weightInGrams).toString(),
        courier: params.courier || 'jne',
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const results = data.rajaongkir?.results?.[0]?.costs || [];
      if (results.length > 0) {
        return results.map((c: any) => ({
          courierCode: params.courier?.toUpperCase() || 'JNE',
          service: c.service,
          description: c.description,
          cost: c.cost[0]?.value || 35000,
          etd: c.cost[0]?.etd ? `${c.cost[0].etd} hari` : '2-3 hari',
        }));
      }
    }
  } catch (error) {
    console.warn('[RajaOngkir Live API Note]: Menggunakan simulasi tabel tarif Manado');
  }

  // Database tarif standar pengiriman dari Manado (Sulut) ke kota-kota besar di Indonesia
  const weightKg = Math.ceil(weightInGrams / 1000);
  const baseRateJneReg = destinationCityId === 'makassar' ? 28000 : destinationCityId === 'surabaya' ? 38000 : 42000;

  return [
    {
      courierCode: 'JNE',
      service: 'REG',
      description: 'Jalur Reguler Ekspedisi JNE',
      cost: baseRateJneReg * weightKg,
      etd: '2-3 hari',
    },
    {
      courierCode: 'JNE',
      service: 'YES',
      description: 'Yakin Esok Sampai (Rekomendasi Makanan Fresh)',
      cost: (baseRateJneReg + 18000) * weightKg,
      etd: '1 hari',
    },
    {
      courierCode: 'POS',
      service: 'KILAT_KHUSUS',
      description: 'Pos Indonesia Kilat Khusus',
      cost: (baseRateJneReg - 5000) * weightKg,
      etd: '3-4 hari',
    },
  ];
}
