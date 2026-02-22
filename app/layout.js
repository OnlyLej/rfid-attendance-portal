import { AppProvider } from './_lib/AppContext';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  title: 'RFID Attendance Portal',
  description: 'Modern attendance management for Philippine schools',
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
