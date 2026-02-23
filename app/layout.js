import { AppProvider } from './_lib/AppContext';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  metadataBase: new URL('https://rfid-attendance-portal.vercel.app'),
  title: 'RFID Attendance Portal',
  description: 'Real-time RFID-powered attendance management for Philippine schools.',
  openGraph: {
    title: 'RFID Attendance Portal',
    description: 'Real-time RFID-powered attendance management for Philippine schools.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
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
