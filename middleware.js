import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check for session cookie set during login
  const session = request.cookies.get('gclt_session');

  // Protect /dashboard and /admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Create redirect URL to login page, passing the original intended URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Sliding session: refresh the cookie so active users stay signed in.
    const response = NextResponse.next();
    response.cookies.set('gclt_session', 'true', {
      path: '/',
      maxAge: 2592000, // 30 days, refreshed on every visit
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};