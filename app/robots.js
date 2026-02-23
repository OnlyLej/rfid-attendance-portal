export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/classroom', '/logs', '/parent'],
    },
    sitemap: 'https://rfid-attendance-portal.vercel.app/sitemap.xml',
  };
}
