import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertAuthConfigured, createSessionToken, hashPassword, sessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    assertAuthConfigured();
    const body = await request.json() as { name?: string; email?: string; password?: string; phone?: string };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;

    if (!name || name.length > 100 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Nama, email valid, dan password minimal 8 karakter wajib diisi.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: typeof body.phone === 'string' ? body.phone.trim() || null : null,
        passwordHash: await hashPassword(password),
        role: 'CUSTOMER',
      },
      select: { id: true, name: true, role: true },
    });

    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.headers.set('Set-Cookie', sessionCookie(token));
    return response;
  } catch (error) {
    console.error('[Auth register]', error);
    return NextResponse.json({ error: 'Pendaftaran gagal. Coba lagi nanti.' }, { status: 500 });
  }
}
