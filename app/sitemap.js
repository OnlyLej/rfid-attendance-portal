import { locales } from './_lib/locales';

const baseUrl = 'https://ridap.lej.qzz.io';

const routes = [
  '',
  'alerts',
  'calendar',
  'child-profile',
  'classroom',
  'dashboard',
  'logs',
  'parent',
  'progress',
  'reports',
  'students',
];

export default function sitemap() {
  const urls = [];

  for (const locale of locales) {
    for (const route of routes) {
      const url = route 
        ? `${baseUrl}/${locale.code}/${route}`
        : `${baseUrl}/${locale.code}`;
      
      urls.push({
        url,
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return urls;
}
