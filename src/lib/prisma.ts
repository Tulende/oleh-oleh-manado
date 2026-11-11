import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

// Tipe untuk Cloudflare env binding
interface CloudflareEnv {
  DB: D1Database;
}

// Buat Prisma client berdasarkan environment
function createPrismaClient(d1?: D1Database) {
  if (d1) {
    // Mode Cloudflare D1 (production / edge runtime)
    const adapter = new PrismaD1(d1);
    return new PrismaClient({ adapter } as any);
  }
  // Mode lokal SQLite (development)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Singleton untuk dev (mencegah koneksi berlipat saat hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper: dapatkan Prisma client dengan D1 binding dari Cloudflare env
export function getPrismaWithD1(env: CloudflareEnv): PrismaClient {
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter } as any);
}

export default prisma;
