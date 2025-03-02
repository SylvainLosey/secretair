import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './locales';

export default getRequestConfig(async ({
  requestLocale
}) => {
  // Get locale from request and handle it properly
  let locale = await requestLocale;
  
  // Fallback to default if locale is invalid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  
  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
    timeZone: 'Europe/Paris'
  };
}); 