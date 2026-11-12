import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertAuthConfigured, createSessionToken, hashPassword, sessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    assertAuthConfigured();
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!bootstrapToken || bootstrapToken.length < 32) {
      return NextResponse.json({ error: 'Pembuatan admin pertama belum diaktifkan.' }, { status: 404 });
    }

    const body = await request.json() as { token?: string; name?: string; email?: string; password?: string };
    if (typeof body.token !== 'string' || body.token.length !== bootstrapToken.length) {
      return NextResponse.json({ error: 'Token bootstrap tidak valid.' }, { status: 401 });
    }
    const supplied = new TextEncoder().encode(body.token);
    const expected = new TextEncoder().encode(bootstrapToken);
    let difference = supplied.length ^ expected.length;
    for (let index = 0; index < Math.min(supplied.length, expected.length); index += 1) difference |= supplied[index] ^ expected[index];
    if (difference !== 0) return NextResponse.json({ error: 'Token bootstrap tidak valid.' }, { status: 401 });

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (!name || name.length > 100 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: 'Nama, email valid, dan password admin minimal 12 karakter wajib diisi.' }, { status: 400 });
    }

    if (await prisma.user.count({ where: { role: 'ADMIN' } })) {
      return NextResponse.json({ error: 'Admin sudah dibuat. Bootstrap tidak dapat digunakan lagi.' }, { status: 409 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email tersebut sudah digunakan.' }, { status: 409 });

    const user = await prisma.user.create({
      data: { name, email, role: 'ADMIN', passwordHash: await hashPassword(password) },
      select: { id: true, name: true, role: true },
    });
    const response = NextResponse.json({ user });
    response.headers.set('Set-Cookie', sessionCookie(await createSessionToken(user)));
    return response;
  } catch (error) {
    console.error('[Auth admin bootstrap]', error);
    return NextResponse.json({ error: 'Pembuatan akun admin gagal.' }, { status: 500 });
  }
}
