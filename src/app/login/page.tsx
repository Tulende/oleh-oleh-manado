'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShoppingBag } from 'lucide-react';

type AccountType = 'customer' | 'admin';

export default function LoginPage() {
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBootstrappingAdmin, setIsBootstrappingAdmin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAccountType(params.get('account') === 'admin' ? 'admin' : 'customer');
  }, []);

  const chooseAccount = (type: AccountType) => {
    setAccountType(type);
    setIsRegistering(false);
    setIsBootstrappingAdmin(false);
    setError('');
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isBootstrappingAdmin ? '/api/auth/admin-bootstrap' : isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, accountType, token: bootstrapToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Permintaan tidak berhasil. Coba lagi.');
        return;
      }

      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
      window.location.assign(safeNext || (data.user.role === 'ADMIN' ? '/admin' : '/'));
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = accountType === 'admin';

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 sm:grid sm:place-items-center">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-orange-700">
          <ArrowLeft className="h-4 w-4" /> Kembali ke toko
        </Link>

        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
          <div className="bg-stone-900 px-7 py-7 text-white">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600">
              {isAdmin ? <LockKeyhole className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Sentra Minahasa</p>
            <h1 className="mt-2 text-2xl font-black">{isBootstrappingAdmin ? 'Buat admin pertama' : isRegistering ? 'Buat akun pembeli' : isAdmin ? 'Login admin' : 'Selamat datang kembali'}</h1>
            <p className="mt-2 text-sm text-stone-300">
              {isAdmin ? 'Masuk ke dashboard pengelolaan toko.' : 'Masuk untuk berbelanja dan melihat pesanan Anda.'}
            </p>
          </div>

          <div className="p-7">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-stone-100 p-1" aria-label="Jenis akun">
              <button type="button" onClick={() => chooseAccount('customer')} className={`rounded-lg py-2.5 text-sm font-semibold ${!isAdmin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
                Pembeli
              </button>
              <button type="button" onClick={() => chooseAccount('admin')} className={`rounded-lg py-2.5 text-sm font-semibold ${isAdmin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
                Admin
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {(isRegistering && !isAdmin || isBootstrappingAdmin) && (
                <>
                  <label className="block text-sm font-medium text-stone-700">
                    Nama lengkap
                    <input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                  </label>
                  {!isAdmin && <label className="block text-sm font-medium text-stone-700">
                    Nomor telepon <span className="font-normal text-stone-400">(opsional)</span>
                    <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                  </label>}
                </>
              )}

              {isBootstrappingAdmin && <label className="block text-sm font-medium text-stone-700">
                Token bootstrap admin
                <input required minLength={32} autoComplete="off" value={bootstrapToken} onChange={(event) => setBootstrapToken(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                <span className="mt-1 block text-xs font-normal text-stone-500">Secret ADMIN_BOOTSTRAP_TOKEN yang Anda atur di Cloudflare.</span>
              </label>}

              <label className="block text-sm font-medium text-stone-700">
                Email
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Password <span className="font-normal text-stone-400">(minimal {isBootstrappingAdmin ? 12 : 8} karakter)</span>
                <span className="relative mt-1.5 block">
                  <input required minLength={isBootstrappingAdmin ? 12 : 8} maxLength={128} type={showPassword ? 'text' : 'password'} autoComplete={isRegistering || isBootstrappingAdmin ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-stone-300 px-3.5 py-3 pr-12 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                  <button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 text-stone-400 hover:text-stone-700">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </span>
              </label>

              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button disabled={loading} className="w-full rounded-xl bg-orange-600 px-4 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Memproses…' : isBootstrappingAdmin ? 'Buat akun admin' : isRegistering ? 'Daftar sebagai pembeli' : 'Masuk'}
              </button>
            </form>

            {isAdmin && !isBootstrappingAdmin && <p className="mt-5 text-center text-sm text-stone-600">
              Admin pertama?{' '}
              <button type="button" onClick={() => { setIsBootstrappingAdmin(true); setError(''); }} className="font-bold text-orange-700 hover:text-orange-800">Buat akun admin</button>
            </p>}
            {isAdmin && isBootstrappingAdmin && <p className="mt-5 text-center text-sm text-stone-600">
              <button type="button" onClick={() => { setIsBootstrappingAdmin(false); setError(''); }} className="font-bold text-orange-700 hover:text-orange-800">Kembali ke login</button>
            </p>}
            {!isAdmin && (
              <p className="mt-5 text-center text-sm text-stone-600">
                {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="font-bold text-orange-700 hover:text-orange-800">
                  {isRegistering ? 'Masuk' : 'Daftar sekarang'}
                </button>
              </p>
            )}
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-stone-500">Akun admin dibuat oleh pengelola. Pendaftaran publik hanya untuk pembeli.</p>
      </div>
    </main>
  );
}
