import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let reqCounter = 1;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const requestHeaders = new Headers(request.headers);
    if (!requestHeaders.has('x-request-id')) {
      const idStr = String(reqCounter++).padStart(3, '0');
      requestHeaders.set('x-request-id', `req-${idStr}`);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

