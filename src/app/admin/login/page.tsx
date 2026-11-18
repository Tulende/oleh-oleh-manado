'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck, Store, UserCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If redirected with bootstrap query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'bootstrap') {
      setIsBootstrapping(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isBootstrapping ? '/api/auth/admin-bootstrap' : '/api/auth/login';
      const payload = isBootstrapping
        ? { token: bootstrapToken, name, email, password }
        : { email, password, accountType: 'admin' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'Autentikasi admin gagal. Silakan periksa kembali kredensial Anda.');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const safeNext = next?.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

      window.location.assign(safeNext);
    } catch {
      setError('Gagal menghubungi server. Pastikan koneksi internet atau server lokal aktif.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative mx-auto w-full max-w-md">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Toko
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-stone-500" /> Portal Pembeli
          </Link>
        </div>

        {/* Card Container */}
        <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/90 backdrop-blur-xl shadow-2xl shadow-black/80">
          
          {/* Card Header */}
          <div className="border-b border-stone-800/80 bg-gradient-to-b from-stone-800/50 to-stone-900/40 p-5 sm:p-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-600 shadow-lg shadow-orange-600/30 text-white">
              {isBootstrapping ? <KeyRound className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Portal Khusus Administrator</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">
              {isBootstrapping ? 'Inisialisasi Admin Pertama' : 'Login Dashboard Admin'}
            </h1>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
              {isBootstrapping
                ? 'Daftarkan akun administrator utama pertama untuk toko Sentra Minahasa dengan token konfigurasi.'
                : 'Masuk untuk mengelola inventori, promosi, CRM segmentasi, dan transaksi operasional.'}
            </p>
          </div>

          {/* Form Body */}
          <div className="p-5 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {isBootstrapping && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Token Bootstrap Admin
                    </label>
                    <input
                      required
                      type="password"
                      autoComplete="off"
                      placeholder="Masukkan ADMIN_BOOTSTRAP_TOKEN"
                      value={bootstrapToken}
                      onChange={(e) => setBootstrapToken(e.target.value)}
                      className="w-full rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-3 text-sm text-white placeholder-stone-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <p className="mt-1 text-[11px] text-stone-400">
                      Token rahasia yang telah diatur pada environment server/Cloudflare.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Nama Lengkap Admin
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Contoh: Administrator Toko"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-3 text-sm text-white placeholder-stone-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Email Admin
                </label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="admin@sentraminahasa.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-3 text-sm text-white placeholder-stone-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                    Password {isBootstrapping && '(min 12 karakter)'}
                  </label>
                </div>
                <div className="relative">
                  <input
                    required
                    minLength={isBootstrapping ? 12 : 6}
                    maxLength={128}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isBootstrapping ? 'new-password' : 'current-password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-3 pr-11 text-sm text-white placeholder-stone-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-200 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-950/60 p-3.5 text-xs text-red-300 leading-relaxed"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (
                  <span>Memverifikasi Kredensial...</span>
                ) : isBootstrapping ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Daftarkan Akun Admin</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Bootstrap toggle */}
            <div className="mt-6 pt-5 border-t border-stone-800 text-center text-xs text-stone-400">
              {isBootstrapping ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsBootstrapping(false);
                    setError('');
                  }}
                  className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  ← Kembali ke Login Admin Biasa
                </button>
              ) : (
                <p>
                  Belum memiliki akun admin utama?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBootstrapping(true);
                      setError('');
                    }}
                    className="font-semibold text-orange-400 hover:text-orange-300 transition-colors underline decoration-dotted"
                  >
                    Inisialisasi Admin Pertama
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-[11px] text-stone-500">
          Dilindungi enkripsi sesi terproteksi. Setiap aktivitas login admin dicatat untuk audit keamanan internal.
        </p>
      </div>
    </main>
  );
}
