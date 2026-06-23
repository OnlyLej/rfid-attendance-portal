import createMiddleware from 'next-intl/middleware';
import { localeCodes, defaultLocale } from './app/_lib/locales';

export default createMiddleware({
  locales: localeCodes,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};