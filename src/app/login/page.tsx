'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, ShoppingBag, User, UserPlus } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') {
      setMode('register');
    }
  }, []);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok. Silakan cek kembali.');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? { name, email, phone, password }
        : { email, password, accountType: 'customer' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat memproses permintaan Anda.');
        return;
      }

      setSuccessMessage(mode === 'register' ? 'Pendaftaran berhasil! Mengalihkan ke toko...' : 'Login berhasil! Mengalihkan...');

      // Redirect user to destination
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/';

      setTimeout(() => {
        window.location.assign(safeNext);
      }, 500);
    } catch {
      setError('Tidak dapat menghubungi server. Periksa koneksi internet atau server lokal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col justify-center px-4 py-12 relative">
      {/* Decorative background circle */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-200/40 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative mx-auto w-full max-w-md">
        
        {/* Top navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Toko
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:border-orange-500 hover:text-orange-700 transition-all shadow-xs"
          >
            <Lock className="h-3 w-3 text-stone-500" /> Portal Admin
          </Link>
        </div>

        {/* Card */}
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
          
          {/* Brand header */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 px-5 py-6 sm:px-7 sm:py-7 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-xl shadow-md">
                S
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                  Sentra Minahasa
                </p>
                <h2 className="text-sm font-semibold text-stone-200">
                  Pusat Oleh-Oleh Khas Sulawesi Utara
                </h2>
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight">
              {mode === 'login' ? 'Masuk ke Akun Pembeli' : 'Daftar Akun Baru'}
            </h1>
            <p className="mt-1.5 text-xs text-stone-300 leading-relaxed">
              {mode === 'login'
                ? 'Akses riwayat pesanan, klaim voucher diskon kuliner, dan checkout lebih cepat.'
                : 'Dapatkan diskon promo selamat datang dan pengiriman fresh vacuum sealed.'}
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {/* Mode Switcher Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-stone-100 p-1" aria-label="Mode Masuk atau Daftar">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Daftar Akun</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Contoh: Pingkan Sondakh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Nomor WhatsApp / HP <span className="font-normal text-stone-400 lowercase">(opsional)</span>
                    </label>
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                    <p className="mt-1 text-[11px] text-stone-500">
                      Digunakan untuk konfirmasi pesanan & tracking resi kurir.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Password <span className="font-normal text-stone-400 lowercase">(minimal 8 karakter)</span>
                </label>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    maxLength={128}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 pr-11 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Konfirmasi Password
                  </label>
                  <input
                    required
                    minLength={8}
                    maxLength={128}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi password di atas"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 leading-relaxed">
                  {error}
                </div>
              )}

              {successMessage && (
                <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-600/20 transition-all hover:bg-orange-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (
                  <span>Memproses...</span>
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Daftar Akun Pembeli</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom info & switch links */}
            <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-600">
              {mode === 'login' ? (
                <p>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-orange-700 hover:text-orange-800 transition-colors"
                  >
                    Daftar sekarang
                  </button>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-orange-700 hover:text-orange-800 transition-colors"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Admin Portal Gateway Card */}
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white/80 backdrop-blur p-4 text-center shadow-xs">
          <p className="text-xs text-stone-600">
            Anda pemilik usaha / staf pengelola toko Sentra Minahasa?
          </p>
          <Link
            href="/admin/login"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            <span>Masuk ke Halaman Login Admin &rarr;</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
