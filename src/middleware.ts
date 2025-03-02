import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '~/i18n/locales';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Use pathname routing instead of locale cookie
  localePrefix: 'as-needed',
  
  // When a user visits the root (e.g. /), 
  // this locale will be used
  localeDetection: true
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/']
}; 