import crypto from 'crypto';

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  settlement_time?: string;
}

function getServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error('Midtrans belum dikonfigurasi: MIDTRANS_SERVER_KEY belum diatur.');
  return key;
}

export function assertMidtransConfigured(): void {
  getServerKey();
}

function getSnapApiUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
}

/** Validasi SHA-512: SHA512(order_id + status_code + gross_amount + ServerKey). */
export function verifyMidtransSignature(payload: MidtransNotificationPayload): boolean {
  if (!payload.order_id || !payload.status_code || !payload.gross_amount || !payload.signature_key) return false;
  let serverKey: string;
  try {
    serverKey = getServerKey();
  } catch {
    return false;
  }
  const expected = crypto.createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest();
  let received: Buffer;
  try {
    received = Buffer.from(payload.signature_key, 'hex');
  } catch {
    return false;
  }
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
}

/** Membuat transaksi Snap sungguhan. Error API diteruskan; tidak ada token simulasi. */
export async function createMidtransSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerDetails: { firstName: string; email: string; phone?: string };
  itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
}): Promise<{ token: string; redirectUrl: string }> {
  const serverKey = getServerKey();
  const response = await fetch(getSnapApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: Math.round(params.grossAmount) },
      item_details: params.itemDetails.map((item) => ({
        id: item.id.substring(0, 50),
        price: Math.round(item.price),
        quantity: item.quantity,
        name: item.name.substring(0, 50),
      })),
      customer_details: {
        first_name: params.customerDetails.firstName,
        email: params.customerDetails.email,
        phone: params.customerDetails.phone || '081234567890',
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    console.error(`[Midtrans Snap] HTTP ${response.status}: ${detail}`);
    throw new Error('Midtrans gagal membuat sesi pembayaran. Periksa Server Key sandbox dan konfigurasi akun.');
  }

  const data = await response.json() as { token?: string; redirect_url?: string };
  if (!data.token || !data.redirect_url) throw new Error('Respons Midtrans tidak berisi token dan URL pembayaran.');
  return { token: data.token, redirectUrl: data.redirect_url };
}
