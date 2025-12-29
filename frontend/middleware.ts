/**
 * Next.js Middleware for SEO and Security
 * Handles www/non-www redirects and other SEO optimizations
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Handle www/non-www redirects (301 permanent redirect)
  // Redirect www to non-www (or vice versa - adjust as needed)
  if (hostname.startsWith('www.')) {
    // Remove www prefix and create new URL
    const nonWwwHostname = hostname.replace('www.', '');
    const newUrl = new URL(request.url);
    newUrl.host = nonWwwHostname;
    return NextResponse.redirect(newUrl, 301);
  }

  // Ensure HTTPS in production
  if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (SEO file)
     * - sitemap.xml (SEO file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

