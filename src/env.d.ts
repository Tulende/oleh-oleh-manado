/// <reference types="@cloudflare/workers-types" />

// Cloudflare Workers / Pages environment bindings
// Auto-loaded by TypeScript via tsconfig references

interface Env {
  DB: D1Database;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_CLIENT_KEY: string;
  RAJAONGKIR_API_KEY: string;
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: string;
    RAJAONGKIR_API_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
