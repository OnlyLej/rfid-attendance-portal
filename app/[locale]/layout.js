import { AppProvider } from '../_lib/AppContext';
import ClientProviders from '../_components/ClientProviders';
import '../globals.css';
import '../odometer-custom.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

const locales = ['en', 'fil'];

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fil' }];
}

export default async function LocaleLayout({ children, params }) {
  // Validate that the incoming `locale` parameter is valid
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
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
