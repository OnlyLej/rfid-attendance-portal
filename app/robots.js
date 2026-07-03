import { localeCodes } from './_lib/locales';

const baseUrl = 'https://ridap.qzz.io';

export default function robots() {
  const disallow = localeCodes.flatMap(code => [
    `/${code}/dashboard`,
    `/${code}/classroom`,
    `/${code}/logs`,
    `/${code}/parent`,
  ]);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}