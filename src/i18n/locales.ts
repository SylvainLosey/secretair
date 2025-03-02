// Create a central file for locale configuration
export const locales = ['en', 'fr', 'de'] as const;
export type Locale = typeof locales[number];
export const defaultLocale = 'en';

// Type guard for locale validation
export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
} 