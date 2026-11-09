import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sentra Kuliner Sulut - Marketplace Oleh-Oleh & UMKM Khas Sulawesi Utara',
  description:
    'Platform Marketplace Kuliner Khas Manado & Minahasa dengan Opsi Kemasan Vacuum, Integrasi Midtrans, Logika Anti-Overselling & CRM Retention',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
