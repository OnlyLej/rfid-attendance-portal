import { AppProvider } from './_lib/AppContext';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL('https://rfid-attendance-portal.vercel.app'),
  title: 'RFID Attendance Portal',
  description: "RFID Attendance Portal is a real-time attendance management system for Philippine schools. Teachers get live dashboards, classroom monitoring, and Excel export. Parents can track their child's daily attendance through a dedicated parent portal.",
  keywords: ['attendance', 'RFID', 'school', 'Philippines', 'dashboard', 'parent portal'],
  authors: [{ name: 'RFID Attendance Portal' }],
  verification: {
    google: 'bwU531pILK45GW9ojO9_GsjUBfbZCuiwO6xYAW_dXsE',
  },
  openGraph: {
    title: 'RFID Attendance Portal',
    description: 'Real-time RFID-powered attendance management for Philippine schools.',
    url: 'https://rfid-attendance-portal.vercel.app',
    siteName: 'RFID Attendance Portal',
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RFID Attendance Portal',
    description: 'Real-time RFID-powered attendance management for Philippine schools.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/ico',
      sizes: '128x128',
      url: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '4000x4000',
      url: '/apple-touch-icon.png',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </AppProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'RFID Attendance Portal',
              url: 'https://rfid-attendance-portal.vercel.app',
              description: 'Real-time RFID-powered attendance management for Philippine schools.',
              publisher: {
                '@type': 'Organization',
                name: 'RFID Attendance Portal',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://rfid-attendance-portal.vercel.app/apple-touch-icon.png',
                },
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
