import { locales } from '~/i18n/locales';

export default async function sitemap() {
  const baseUrl = 'https://postmail.ai';
  
  // Get current date for lastModified
  const currentDate = new Date();

  // Core routes that exist in your application (just the homepage for now)
  const routes = ['/'];
  
  // Generate entries for each locale and route combination
  const entries = locales.flatMap(locale => {
    return routes.map(route => {
      // For the default locale (usually 'en'), we might want the root URL
      // For other locales, we include the locale in the path
      const localePath = locale === 'en' ? '' : `/${locale}`;
      const path = route === '/' ? localePath : `${localePath}${route}`;
      
      return {
        url: `${baseUrl}${path}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 1.0,
      };
    });
  });

  return entries;
} 