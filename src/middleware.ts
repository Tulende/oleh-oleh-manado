import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, readSessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const user = await readSessionToken(getSessionCookie(request));
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminPage && user?.role !== 'ADMIN') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('account', 'admin');
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL(user.role === 'ADMIN' ? '/admin' : '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
