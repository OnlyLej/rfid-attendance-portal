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
      // Redirect all other requests to maintenance page
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}/maintenance`;
      return NextResponse.redirect(url);
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