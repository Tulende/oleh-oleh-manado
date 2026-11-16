import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, readSessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const user = await readSessionToken(getSessionCookie(request));
  const pathname = request.nextUrl.pathname;

  const isAdminLogin = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin') && !isAdminLogin;

  // Protect /admin routes from unauthenticated or non-admin users
  if (isAdminPage && user?.role !== 'ADMIN') {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in as ADMIN, skip admin login and go to /admin
  if (isAdminLogin && user?.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If user visits customer login while already authenticated
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL(user.role === 'ADMIN' ? '/admin' : '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
