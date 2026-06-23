import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { localeCodes, defaultLocale } from '../app/_lib/locales';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!localeCodes.includes(locale)) notFound();

  const userMessages = (await import(`../messages/${locale}.json`)).default;
  const fallback = locale !== defaultLocale
    ? (await import(`../messages/${defaultLocale}.json`)).default
    : {};

  return {
    locale,
    messages: { ...fallback, ...userMessages },
  };
});