import { AppProvider } from '../_lib/AppContext';
import ClientProviders from '../_components/ClientProviders';
import '../globals.css';
import '../odometer-custom.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { localeCodes } from '../_lib/locales';
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return localeCodes.map(locale => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!localeCodes.includes(locale)) notFound();

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