import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { localeCodes, defaultLocale } from './app/_lib/locales';

const intlMiddleware = createMiddleware({
  locales: localeCodes,
  defaultLocale,
  localePrefix: 'always',
});

export default async function middleware(request) {
  // Check maintenance mode from Edge Config
  try {
    const maintenanceMode = await get('maintenanceMode');
    if (maintenanceMode === true) {
      // Allow access to maintenance page itself
      if (request.nextUrl.pathname.includes('/maintenance')) {
        return intlMiddleware(request);
      }
      // Store original URL before redirecting to maintenance
      const response = NextResponse.redirect(new URL(`/${defaultLocale}/maintenance`, request.url));
      response.cookies.set('preMaintenanceUrl', request.nextUrl.pathname, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      return response;
    }
  } catch (error) {
    // Edge Config might not be available in development, continue normally
    console.log('Edge Config not available, skipping maintenance check');
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|maintenance|.*\\..*).*)'],
};