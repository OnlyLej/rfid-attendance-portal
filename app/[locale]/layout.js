import { AppProvider } from '../_lib/AppContext';
import ClientProviders from '../_components/ClientProviders';
import '../globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'fil'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params: { locale } }) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <ClientProviders>{children}</ClientProviders>
            <Analytics />
            <SpeedInsights />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
