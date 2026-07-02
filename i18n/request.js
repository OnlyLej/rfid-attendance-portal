import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale) locale = 'en';

  try {
    const userMessages = (await import(`../messages/${locale}.json`)).default;
    const fallback = locale !== 'en'
      ? (await import(`../messages/en.json`)).default
      : {};

    return {
      locale,
      messages: { ...fallback, ...userMessages },
    };
  } catch (e) {
    const userMessages = (await import(`../messages/en.json`)).default;
    return {
      locale: 'en',
      messages: userMessages,
    };
  }
});