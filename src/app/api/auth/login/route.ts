import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertAuthConfigured, createSessionToken, sessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    assertAuthConfigured();
    const body = await request.json() as { email?: string; password?: string; accountType?: string };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    const accountType = body.accountType === 'admin' ? 'ADMIN' : 'CUSTOMER';

    if (!email || !password) return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== accountType || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Email atau password salah, atau role akun tidak sesuai.' }, { status: 401 });
    }

    const sessionUser = { id: user.id, name: user.name, role: user.role };
    const response = NextResponse.json({ user: sessionUser });
    response.headers.set('Set-Cookie', sessionCookie(await createSessionToken(sessionUser)));
    return response;
  } catch (error) {
    console.error('[Auth login]', error);
    return NextResponse.json({ error: 'Login gagal. Coba lagi nanti.' }, { status: 500 });
  }
}
