import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = request.nextUrl;

  // Allow public routes: login, signup, NextAuth API, webhooks, and seed endpoint
  if (
    pathname === '/login' ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/signup') ||
    pathname.startsWith('/api/webhooks') ||
    pathname === '/api/seed' ||
    pathname === '/api/debug-user'
  ) {
    return NextResponse.next();
  }

  // Protect dashboard and other API routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
