import { AppProvider } from './_lib/AppContext';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL('https://rfid-attendance-portal.vercel.app'),

  title: 'RFID Attendance Portal',
  description: 'Real-time RFID-powered attendance management for Philippine schools.',
  keywords: ['attendance', 'RFID', 'school', 'Philippines', 'dashboard', 'parent portal'],
  authors: [{ name: 'RFID Attendance Portal' }],

  verification: {
    google: 'bwU531pILK45GW9ojO9_GsjUBfbZCuiwO6xYAW_dXsE',  // ← add this
  },
  
  openGraph: {
    title: 'RFID Attendance Portal',
    description: 'Real-time RFID-powered attendance management for Philippine schools.',
    url: 'https://rfid-attendance-portal.vercel.app',
    siteName: 'RFID Attendance Portal',
    locale: 'en_PH',
    type: 'website',
    // opengraph-image.png placed in app/ folder handles the image automatically
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

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
      </body>
    </html>
  );
}
