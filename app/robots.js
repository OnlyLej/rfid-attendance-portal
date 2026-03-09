export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/classroom', '/logs', '/parent'],
    },
    sitemap: 'https://ridap.vercel.app/sitemap.xml',
  };
}
