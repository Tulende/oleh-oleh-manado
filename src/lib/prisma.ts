import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Tipe untuk Cloudflare env binding
interface CloudflareEnv {
  DB: D1Database;
}

// Buat Prisma client berdasarkan binding D1 atau SQLite lokal.
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
  d1Clients?: WeakMap<D1Database, PrismaClient>;
};

const localPrisma =
  process.env.NODE_ENV === 'production'
    ? undefined
    : globalForPrisma.prisma ?? createPrismaClient();
const d1Clients = globalForPrisma.d1Clients ??= new WeakMap();

if (localPrisma && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = localPrisma;
}

function getRequestPrismaClient(): PrismaClient {
  let env: CloudflareEnv;
  try {
    env = getCloudflareContext().env as unknown as CloudflareEnv;
  } catch (error) {
    // Keep `next dev` usable with the local SQLite database when no Worker
    // request context exists. Production requests must use the D1 binding.
    if (localPrisma) return localPrisma;
    throw error;
  }

  if (!env.DB) {
    if (localPrisma) return localPrisma;
    throw new Error('Cloudflare D1 binding "DB" is not configured.');
  }

  let client = d1Clients.get(env.DB);
  if (!client) {
    client = createPrismaClient(env.DB);
    d1Clients.set(env.DB, client);
  }
  return client;
}

// Resolve the client when a query runs, inside the request's Worker context.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getRequestPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
