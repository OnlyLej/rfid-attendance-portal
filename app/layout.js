import './odometer-theme.css';

export const metadata = {
  metadataBase: new URL('https://ridap.lej.qzz.io'),
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
    url: 'https://ridap.lej.qzz.io',
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
      type: 'image/svg',
      sizes: '256x256',
      url: '/icon.svg',
    },
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

  alternates: {
    canonical: '/',
    languages: {
      'en': 'https://ridap.lej.qzz.io/en',
      'tl': 'https://ridap.lej.qzz.io/tl',
      'ceb': 'https://ridap.lej.qzz.io/ceb',
      'ilo': 'https://ridap.lej.qzz.io/ilo',
      'hil': 'https://ridap.lej.qzz.io/hil',
      'war': 'https://ridap.lej.qzz.io/war',
      'pam': 'https://ridap.lej.qzz.io/pam',
      'bik': 'https://ridap.lej.qzz.io/bik',
      'x-default': 'https://ridap.lej.qzz.io',
    },
  },
  
  links: [
    {
      rel: 'canonical',
      url: 'https://ridap.lej.qzz.io',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}