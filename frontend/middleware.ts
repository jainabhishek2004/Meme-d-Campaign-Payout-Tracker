import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection: prevent creator accessing brand dashboard and vice versa
    if (role === 'creator' && pathname.startsWith('/dashboard/brand')) {
      return NextResponse.redirect(new URL('/dashboard/creator', request.url));
    }
    if (role === 'brand' && pathname.startsWith('/dashboard/creator')) {
      return NextResponse.redirect(new URL('/dashboard/brand', request.url));
    }

    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      if (role === 'brand') {
        return NextResponse.redirect(new URL('/dashboard/brand', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard/creator', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
