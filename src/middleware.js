import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;

  // Paths that are accessible without logging in
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/apply' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/verify/') ||
    pathname.startsWith('/logo.') ||
    pathname.startsWith('/template.') ||
    pathname.startsWith('/idcard_rk.');

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      // Basic check if token exists, full verification can be done but jose is needed for Edge Runtime
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      
      // If logged in and trying to access login page, redirect to dashboard
      if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Invalid token
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

// Config to specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - template.png (background image)
     */
    '/((?!_next/static|_next/image|favicon.ico|template.png).*)',
  ],
};
