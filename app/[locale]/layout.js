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

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!localeCodes.includes(locale)) notFound();

  const messages = await getMessages({ locale });

  return (
    <>
      <NextIntlClientProvider messages={messages}>
        <AppProvider>
          <ClientProviders>{children}</ClientProviders>
          <Analytics />
          <SpeedInsights />
        </AppProvider>
      </NextIntlClientProvider>
    </>
  );
}