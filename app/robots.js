export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/classroom', '/logs', '/parent'],
    },
  };
}
